/**
 * Kanban
 * 
 * Author: Rafael Odon (odon.rafael@gmail.com)
 * Git: https://github.com/rafaelodon/kanban
 *
 */

// Constants
var DRAG_OPTIONS = {
	containment: 'window',
	helper: getDragTaskHelper,
	start: onStartDragTask,
	stop: onStopDragTask	
};
var ELLIPSIS_OPTIONS = {
	ellipsis : "...",
	watch: "window"
};

// Dependencies
var storage = new KanbanStorage();

// Aplication Model
var boards = []
var currentBoard = null;
var currentTaskId = null;
var lastTaskId = 1;
var draggedFrom = null;
var draggedTo = null;
var draggedTask = null;

$(function (){
	
	// Drag & Drop
	$('.task').draggable(DRAG_OPTIONS);	
	$('.tasksarea').droppable({ drop: onDropTask });	

	// Task actions
	$(".tasksarea").on("click", ".task-remove", onClickRemoveTask);
	$(".tasksarea").on("click", ".task-edit", onClickEditTask);
	$(".tasksarea").on("click", ".task-zoom", onClickZoomTask);	
	$(".tasksarea").on("click", ".task-archive", onClickArchiveTask);
	$(".tasksarea").on("mouseover", ".task", onMouseOverTask);
	$(".tasksarea").on("mouseout", ".task", onMouseOutTask);	

	// Add/Edit task bindings
	$("#btnAddTask").click(onClickBtnAddTask);
	$('#btnTaskCancel').click(hideModals);
	$("#btnTaskOk").click(onClickBtnTaskOk);			

	//Preview task binding
	$("#btnTaskPreviewOk").click(hideModals);

	// Export bindings
	$("#export").click(onClickExport);
	$("#btnExportClose").click(hideModals);

	// Import bindings
	$("#import").click(onClickImport);	
	$("#btnImportCancel").click(hideModals);
	$("#btnImportOk").click(onClickBtnImportOk);
	bindPressEnter("#inputTaskTitle",onClickBtnTaskOk)
	bindPressEnter("#inputTaskDescription",onClickBtnTaskOk)

	// boards bindings
	$('#linkNewWorkspace').click(onClickCreateNewWorkspace);
	$('#linkRenameWorkspace').click(onClickRenameWorkspace);
	$('#linkRemoveWorkspace').click(onClickRemoveBoard);

	$('#linkTasksHistory').click(onClickTasksHistory);
	$('#btnHistoryOk').click(onClickHistoryOk);

	// Others
	$('.nav a').on('click', onClickNavbarLink);

	boards = storage.listExistingBoards();
	currentBoard = storage.loadLastBoard();
	
	renderboardsMenu();
	redrawKanban();		
});

function bindPressEnter(selector,event){
	$(selector).on("keypress",function(e){
		var key = e.which;
		if(key == 13) {
			event();
			return true;  
		}
	});
}

/* General functions */
function renderboardsMenu(){
	if(currentBoard.id == storage.DEFAULT_BOARD_ID){
		$("#linkRemoveWorkspace").hide();
		$("#linkRenameWorkspace").hide();
	}else{
		$("#linkRemoveWorkspace").show();
		$("#linkRenameWorkspace").show();
	}

	$(".liWorkspace").remove();
	boards.forEach(function(board) {
		var $a = $("<a>", {href: "#", id: board.id});
		$a.html(board.name);
		$a.click(onSelectWorkspace);

		var $li = $("<li>", {class: "liWorkspace"});
		$li.append($a);
		
		$("#ulWorkspaces").append($li);
	});
}

function drawTask(id){
	var task = currentBoard.tasks[id];
    if(task.visible != false){
    	var $div = $("<div>", {id: id, class: "task"});	
    	$div.append("<h3>"+task.title+"</h3>");
	    $div.append("<p>"+task.description+"</p>");
	    $div.append("<span class='task-action task-remove glyphicon glyphicon-remove' aria-hidden='true' title='Remove'></span>&nbsp;");
    	$div.append("<span class='task-action task-edit glyphicon glyphicon-pencil' aria-hidden='true' title='Edit'></span>&nbsp;");
    	$div.append("<span class='task-action task-zoom glyphicon glyphicon-zoom-in' aria-hidden='true' title='Zoom'></span>&nbsp;");
        if(task.state == "done"){
           	$div.append("<span class='task-action task-archive glyphicon glyphicon-save' aria-hidden='true' title='Archive'></span>");
        }
    	$div.draggable(DRAG_OPTIONS);	
    	$("div[kanban-column-id="+task.state+"]").append($div);
    	$("#"+id+" p, #"+id+" h3").dotdotdot(ELLIPSIS_OPTIONS);	
    }
}

function redrawTask(id){
	var task = currentBoard.tasks[id];
    $div = $("#"+id);
    if(task.visible != false){
        $div.find("h3").html(task.title);
        $div.find("p").html(task.description);
    }else{
        $div.hide();
    }
}

function showModal(m){
	$("#modalContainer").find(".modal").hide();
	$("#modalContainer").show(); 		
	$("#"+m).show();
}

function hideModals(){
	$("#modalContainer").find(".modal").hide();
	$("#modalContainer").hide();
}

function redrawKanban(){
	
	lastTaskId = 0;	
	
	var title = "Kanban - "+currentBoard.name;	
	document.title = title;
	$("#title").html(currentBoard.name);

	$(".task").remove();	

	for(var t in currentBoard.tasks){
		var idNum = parseInt(t.replace(/t/g,''));
		if(idNum > lastTaskId){
			lastTaskId = idNum;			
		}		
		drawTask(t);
	};
}

/* Drag events */

function getDragTaskHelper(){				
	clone = $(this).clone();
	clone.addClass('dragging');
	clone.outerWidth($(this).outerWidth());
	return clone;
}

function onStartDragTask( event, ui ) {
	draggedTask = event.currentTarget;
	draggedFrom = $(draggedTask.parentElement).attr("kanban-column-id");	
	$(draggedTask).addClass('dragged');
}

function onStopDragTask(event, ui) {						
	$(draggedTask).removeClass('dragged');	
}

function onDropTask(event, ui) {												
	draggedTo = $(this).attr("kanban-column-id");	
	if(draggedFrom != draggedTo){
		var id = $(ui.draggable).attr("id");														
		currentBoard.tasks[id].state = draggedTo;
		if(!currentBoard.tasks[id].history){
			currentBoard.tasks[id].history = [];
		};
		currentBoard.tasks[id].history.push({"date": new Date(), "state":draggedTo})
		drawTask(id);
		storage.saveBoard(currentBoard);
		ui.draggable.remove();				
	}
}

/* Events */

function onClickBtnAddTask(){
	currentTaskId = null;
	$("#modalTask h2").html("Add Task");
	$("#inputTaskTitle").val(null);
	$("#inputTaskDescription").val(null);
	showModal("modalTask")		
	$("#inputTaskTitle").focus();
}

function onClickCreateNewWorkspace(){	
	var boardName = prompt(message("workspace_new"));
	if(boardName){
		var boardId = generateBoardId();

		var newBoard = { id: boardId, name: boardName, tasks: {}};
		boards.push(newBoard);		
		storage.saveBoard(newBoard);
		storage.saveExistingBoardsList(boards);		
		
		renderboardsMenu();		
		switchToBoard(boardId);
	}
}

function generateBoardId(){
	return "kanban.boards."+new Date().getTime();
}

function onClickRenameWorkspace(){	
	var newWorkspaceName = prompt(message("workspace_rename"));
	if(newWorkspaceName){		
		boards[currentBoard] = newWorkspaceName;
		storage.saveExistingBoardsList(boards);		
		redrawKanban();

	}
}

function onClickRemoveBoard(){
	if(confirm(message("confirm_workspace_remove",boards[currentBoard]))){		
		removeCurrentBoard();
		renderboardsMenu();
		switchToBoard(storage.DEFAULT_BOARD_ID);
	}
}

function removeCurrentBoard(){	
	storage.removeBoardById(currentBoard.id);
	boards = boards.filter( function(b) {
		return b.id != currentBoard.id;
	});	
	storage.saveExistingBoardsList(boards);	
}

function onClickTasksHistory(){
	tb = $("#historyTable tbody");
	tb.empty();
	
	var tasksArray = [];
	for(var t in currentBoard.tasks){
		tasksArray.push(currentBoard.tasks[t]);
	}

	tasksArray.sort(function(a,b){
        if(a.history != 'undefined' && b.history != 'undefined'){
			d1 = new Date(a.history[a.history.length-1].date);
			d2 = new Date(b.history[b.history.length-1].date);			
			if(d1.getTime() == d2.getTime()){
				return 0;
			}else if(d1.getTime() > d2.getTime()){
				return -1;
			}else{
				return 1;
			}		
        }else if(a.history != 'undefined'){
            return 1;
        }else{
            return 0;
        }
    });
	
	for(var t in tasksArray){		
		var task = tasksArray[t];
		var dateText = "";
		if(task.history){						
			dateText = dataFormatada(new Date(task.history[task.history.length-1].date));
		}
		var cssClass = "";
		if(task.state === "todo"){
			cssClass += "red";
		}else if(task.state === "wip"){
			cssClass += "yellow";
		}else if(task.state === "done"){
			cssClass += "green";
		}		

		tb.append("<tr class="+cssClass+"><td>"+task.title+"</td><td>"+task.state+"</td><td>"+dateText+"</td></tr>");
	}
	
	showModal("modalHistory");
	$("#historyTableContainer").height($("#modalHistory").outerHeight() * 0.75);
}

function dataFormatada(data){    		
    var dia = data.getDate();
    var mes = data.getMonth()+1;
    var ano = data.getFullYear();  
	var horas = data.getHours();
	var minutos = data.getMinutes();
    dia = dia < 10 ? "0"+dia : dia;
    mes = mes < 10 ? "0"+mes : mes;
	horas = horas < 10 ? '0'+horas : horas;
	minutos = minutos < 10 ? '0'+minutos : minutos;

	return dia+"/"+mes+"/"+ano+" "+horas+":"+ minutos;    
}

function onClickHistoryOk(){
	hideModals();
}

function onClickBtnTaskOk() {
	var title = $("#inputTaskTitle").val();
	var description = $("#inputTaskDescription").val();
	var id = currentTaskId;
	if(id == null){				
		lastTaskId++;
		id = "t"+(lastTaskId);
	}	
	
	if(title.trim() != ''){
		if(currentTaskId == null){
			currentBoard.tasks[id] = {"title":title, "description":description, "state":"todo" };
			currentBoard.tasks[id].history = [{"date": new Date(), "state":"todo"}];
			drawTask(id);
		}else{
			currentBoard.tasks[id].title = title;
			currentBoard.tasks[id].description = description;			
			redrawTask(id);
		}		
		storage.saveBoard(currentBoard);		
		hideModals();
		$("#labelTaskTitle").removeClass("required");
    	return true;
    }else{
    	$("#labelTaskTitle").addClass("required");
    	$("#inputTaskTitle").focus();
    	return false;
    }
}

function onClickRemoveTask(e){ 
	id = e.target.parentElement.id;
	if(confirm(message("confirm_remove_task",currentBoard.tasks[id].title))){			
		delete currentBoard.tasks[id];
		storage.saveBoard(currentBoard);
		$("#"+id).remove();
	}
}

function onClickEditTask(e){ 
	var id = e.target.parentElement.id;
	$("#modalTask h2").html("Edit Task");
	$("#inputTaskTitle").val(currentBoard.tasks[id].title);
	$("#inputTaskDescription").val(currentBoard.tasks[id].description);
	showModal("modalTask"); 
	$("#inputTaskTitle").focus();
	currentTaskId = id;
}

function onClickZoomTask(e){
	var id = e.target.parentElement.id;	
	$("#modalPreview h2").html(currentBoard.tasks[id].title);	
	$("#modalPreview p").html(currentBoard.tasks[id].description);
	$("#modalPreview>div").css("background-color", $(e.target.parentElement).css("background-color"));
	showModal("modalPreview");	
}

function onClickExport(){		
	$("#inputExportJson").val(JSON.stringify(currentBoard));		
	showModal("modalExport")
}

function onClickImport(){				
	
	$("#inputImportWorkspaceName").val("");
	$("#labelWorkspaceName").removeClass("required");

	$("#inputImportJson").val("");
	$("#labelImportJson").removeClass("required");

	showModal("modalImport")
}

function onClickArchiveTask(e){
    var id = e.target.parentElement.id;
	if(confirm(message("confirm_archive_task",currentBoard.tasks[id].title))){
       currentBoard.tasks[id].visible = false;
       redrawTask(id);
       storage.saveBoard(currentBoard);
    }
}

function onMouseOverTask(){
	$(this).find(".task-action").show();
}

function onMouseOutTask(){
	$(this).find(".task-action").hide();
}

function onClickBtnImportOk(){

	$("#labelWorkspaceName").removeClass("required");
	$("#labelImportJson").removeClass("required");

	try {
		var boardName = $("#inputImportWorkspaceName").val();	
		if(boardName.trim() === ''){			
	    	$("#labelWorkspaceName").addClass("required");
	    	$("#inputImportWorkspaceName").focus();
	    	return false;
	    }

    	var boardObject = JSON.parse($("#inputImportJson").val());
    	if(confirm(message("confirm_import_tasks"))){

			var boardId = generateBoardId();
			currentBoard = { id : boardId, name: boardName, tasks : boardObject["tasks"] };
			boards.push(currentBoard);			
			storage.saveBoard(currentBoard);			
			storage.saveExistingBoardsList(boards);
						
			switchToBoard(boardId);
    		hideModals();        		    		

    		return true;
    	}
	} catch (e) {
		console.log(e)
		alert(message("error_invalid_json"));
		$("#labelImportJson").addClass("required");
		$("#inputImportJson").focus();
    	return false;
	}    			
}

function onClickNavbarLink(){ 
	// Hides the collapsed navbar once a link gets clicked
    if($('.navbar-toggle').css('display') !='none'){
        $(".navbar-toggle").trigger( "click" );
    }
}

function onSelectWorkspace(){			
	switchToBoard($(this).attr("id"));	
}

function switchToBoard(boardId){
	currentBoard = storage.loadBoardById(boardId);		
	renderboardsMenu();
	redrawKanban();
}
