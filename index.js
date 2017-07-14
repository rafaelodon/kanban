/**
 * Kanban
 * 
 * Author: Rafael Odon (odon.rafael@gmail.com)
 * Git: https://github.com/rafaelodon/kanban
 *
 */

// Constants
var KANBAN_BOARDS = "kanban.workspaces";
var KANBAN_LAST_BOARD = "kanban.lastWorkspace";
var KANBAN_DEFAULT_BOARD_ID = "default";
var KANBAN_DEFAULT_BOARD_NAME = "Default Board";
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

// Aplication Model
var workspaces = {}
var tasks = {}
var currentWorkspace = KANBAN_DEFAULT_BOARD_ID;
var currentTaskId = null;
var lastTask = 1;
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
    $(".tasksarea").on("click", ".tasrk-archive", onClickArchiveTask);
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

	// Workspaces bindings
	$('#linkNewWorkspace').click(onClickCreateNewWorkspace);
	$('#linkRenameWorkspace').click(onClickRenameWorkspace);
	$('#linkRemoveWorkspace').click(onClickRemoveWorkspace);

	$('#linkTasksHistory').click(onClickTasksHistory);
	$('#btnHistoryOk').click(onClickHistoryOk);

	// Others
	$('.nav a').on('click', onClickNavbarLink);

	initializeKanbanData();
	renderWorkspacesMenu();
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

function restoreLastWorkspace(){
	if(typeof window.localStorage.getItem(KANBAN_LAST_BOARD) !== "undefined" &&
		window.localStorage.getItem(KANBAN_LAST_BOARD) != null &&
		window.localStorage.getItem(KANBAN_LAST_BOARD) in workspaces){		
		currentWorkspace = window.localStorage.getItem(KANBAN_LAST_BOARD);
	}
}

function restoreWorkspaces(){
	workspaces = JSON.parse(window.localStorage.getItem(KANBAN_BOARDS));
	restoreLastWorkspace();
}

function saveWorkspaces(){
	window.localStorage.setItem(KANBAN_BOARDS, JSON.stringify(workspaces));
}

function getWorkspaceName(workspaceId){
	return KANBAN_BOARDS+"."+workspaceId;
}

function restoreTasks(){
	tasks = JSON.parse(window.localStorage.getItem(getWorkspaceName(currentWorkspace)));
	if(tasks == null || tasks === "undefined"){
		tasks = {};
	}
}

function saveTasks(){
	window.localStorage.setItem(getWorkspaceName(currentWorkspace), JSON.stringify(tasks));
}

function initializeKanbanData(){
	if(typeof window.localStorage.getItem(KANBAN_BOARDS) === "undefined" ||
		window.localStorage.getItem(KANBAN_BOARDS) == null || 
		window.localStorage.getItem(KANBAN_BOARDS) == "{}"){
		workspaces = {};
		workspaces[KANBAN_DEFAULT_BOARD_ID] = KANBAN_DEFAULT_BOARD_NAME;
		saveWorkspaces();
	}else{
		restoreWorkspaces();		
	}		

	if(typeof window.localStorage.getItem(getWorkspaceName(currentWorkspace)) === "undefined" || 
		window.localStorage.getItem(getWorkspaceName(currentWorkspace)) == null){	
		tasks = {};
		saveTasks();	
	}else{
		restoreTasks();	
	}
}

function renderWorkspacesMenu(){
	workspaces = JSON.parse(window.localStorage.getItem(KANBAN_BOARDS));	

	if(currentWorkspace == KANBAN_DEFAULT_BOARD_ID){
		$("#linkRemoveWorkspace").hide();
		$("#linkRenameWorkspace").hide();
	}else{
		$("#linkRemoveWorkspace").show();
		$("#linkRenameWorkspace").show();
	}

	$(".liWorkspace").remove();
	for(var w in workspaces){		

		var $a = $("<a>", {href: "#", id: w});
		$a.html(workspaces[w]);

		$a.click(onSelectWorkspace);

		var $li = $("<li>", {class: "liWorkspace"});
		$li.append($a);

		$("#ulWorkspaces").append($li);
	}
}

function drawTask(id){
	var task = tasks[id];
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
	var task = tasks[id];r
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
	$("#modalContainer").fadeIn(); 		
	$("#"+m).fadeIn();
}

function hideModals(){
	$("#modalContainer").find(".modal").fadeOut();
	$("#modalContainer").fadeOut();
}

function redrawKanban(){
	
	lastTask = 0;	
	
	var title = "Kanban - "+workspaces[currentWorkspace];	
	document.title = title;
	$("#title").html(workspaces[currentWorkspace]);

	$(".task").remove();	

	for(var t in tasks){
		var idNum = parseInt(t.replace(/t/g,''));
		if(idNum > lastTask){
			lastTask = idNum;			
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
		tasks[id].state = draggedTo;
		if(!tasks[id].history){
			tasks[id].history = [];
		};
		tasks[id].history.push({"date": new Date(), "state":draggedTo})
		drawTask(id);				
		saveTasks();			
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
	var workspaceName = prompt(message("workspace_new"));
	if(workspaceName){
		var workspaceId = generateWorkspaceId();
		workspaces[workspaceId] = workspaceName;		
		saveWorkspaces();
		renderWorkspacesMenu();		
		switchToWorkspace(workspaceId);
	}
}

function generateWorkspaceId(){
	return new Date().getTime();
}

function onClickRenameWorkspace(){	
	var newWorkspaceName = prompt(message("workspace_rename"));
	if(newWorkspaceName){		
		workspaces[currentWorkspace] = newWorkspaceName;
		saveWorkspaces();		
		redrawKanban();

	}
}

function onClickRemoveWorkspace(){
	if(confirm(message("confirm_workspace_remove",workspaces[currentWorkspace]))){
		//remove old workspace
		removeWorkspace(currentWorkspace);
		renderWorkspacesMenu();
		switchToWorkspace(KANBAN_DEFAULT_BOARD_ID);
	}
}

function removeWorkspace(workspaceId){	
	window.localStorage.setItem(getWorkspaceName(workspaceId),"undefined");
	delete workspaces[workspaceId];
	saveWorkspaces();	
}

function onClickTasksHistory(){
	tb = $("#historyTable tbody");
	tb.empty();
	
	var tasksArray = [];
	for(var t in tasks){
		tasksArray.push(tasks[t]);
	}

	tasksArray.sort(function(a,b){
        if(a.history && b.history){
            return a.history[a.history.length-1].date < b.history[b.history.length-1].date;
        }else if(a.history){
            return false;
        }else{
            return true;
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
		lastTask++;
		id = "t"+(lastTask);
	}	
	
	if(title.trim() != ''){
		if(currentTaskId == null){
			tasks[id] = {"title":title, "description":description, "state":"todo" };														
			tasks[id].history = [{"date": new Date(), "state":"todo"}];
			drawTask(id);
		}else{
			tasks[id].title = title;
			tasks[id].description = description;			
			redrawTask(id);
		}
		saveTasks();
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
	if(confirm(message("confirm_remove_task",tasks[id].title))){			
		delete tasks[id];
		saveTasks();
		$("#"+id).remove();
	}
}

function onClickEditTask(e){ 
	var id = e.target.parentElement.id;
	$("#modalTask h2").html("Edit Task");
	$("#inputTaskTitle").val(tasks[id].title);
	$("#inputTaskDescription").val(tasks[id].description);
	showModal("modalTask"); 
	$("#inputTaskTitle").focus();
	currentTaskId = id;
}

function onClickZoomTask(e){
	var id = e.target.parentElement.id;	
	$("#modalPreview h2").html(tasks[id].title);	
	$("#modalPreview p").html(tasks[id].description);
	$("#modalPreview>div").css("background-color", $(e.target.parentElement).css("background-color"));
	showModal("modalPreview");	
}

function onClickExport(){		
	$("#inputExportJson").val(JSON.stringify(tasks));		
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
	if(confirm(message("confirm_archive_task",tasks[id].title))){
       tasks[id].visible = false;
       redrawTask(id);
       saveTasks();
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
		var workspaceName = $("#inputImportWorkspaceName").val();	
		if(workspaceName.trim() === ''){			
	    	$("#labelWorkspaceName").addClass("required");
	    	$("#inputImportWorkspaceName").focus();
	    	return false;
	    }

    	var tasksTemp = JSON.parse($("#inputImportJson").val());
    	if(confirm(message("confirm_import_tasks"))){

			var workspaceId = generateWorkspaceId();
			workspaces[workspaceId] = workspaceName;								
			saveWorkspaces();			
			tasks = tasksTemp;
			currentWorkspace = workspaceId;
			saveTasks();
			switchToWorkspace(workspaceId);						
    		hideModals();        		    		

    		return true;
    	}
	} catch (e) {
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
	switchToWorkspace($(this).attr("id"));	
}

function switchToWorkspace(workspaceId){
	currentWorkspace = workspaceId;
	updateLastWorkspace();	
	initializeKanbanData();	
	renderWorkspacesMenu();
	redrawKanban();
}

function updateLastWorkspace(){
	window.localStorage.setItem(KANBAN_LAST_BOARD, currentWorkspace);
}
