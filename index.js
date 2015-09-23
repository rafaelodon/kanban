/**
 * Kanban
 * 
 * Author: Rafael Odon (odon.rafael@gmail.com)
 * Git: https://github.com/rafaelodon/kanban
 */

var KANBAN_WORKSPACES = "kanban.workspaces";
var workspaces = {}
var tasks = {}
var currentWorkspace = "default";
var currentTaskId = null;
var lastTask = 1;
var de = null;
var para= null;
var draggedTask = null;
var dragOptions = {
	containment: 'window',
	helper: getDragTaskHelper,
	start: onStartDragTask,
	stop: onStopDragTask
};

$(function (){ 				
	
	// Drag & Drop
	$('.task').draggable(dragOptions);	
	$('.column').droppable({ drop: onDropTask });	

	// Task actions
	$(".column").on("click", ".task-remove", onClickRemoveTask);
	$(".column").on("click", ".task-edit", onClickEditTask);
	$(".column").on("mouseover", ".task", onMouseOverTask);
	$(".column").on("mouseout", ".task", onMouseOutTask);	

	// Add task bindings
	$("#btnAddTask").click(onClickBtnAddTask);
	$('#btnTaskCancel').click(hideModals);
	$("#btnTaskOk").click(onClickBtnTaskOk);			

	// Export bindings
	$("#export").click(onClickExport);
	$("#btnExportClose").click(hideModals);

	// Import bindings
	$("#import").click(onClickImport);	
	$("#btnImportCancel").click(hideModals);
	$("#btnImportOk").click(onClickBtnImportOk);

	// Workspaces bindings
	$('#linkNewWorkspace').click(onClickCreateNewWorkspace);

	// Others
	$('.nav a').on('click', onClickNavbarLink);

	initializeKanbanData();
	renderWorkspacesMenu();
	redrawKanban();	

});

/* General functions */

function restoreWorkspaces(){
	workspaces = JSON.parse(window.localStorage.getItem(KANBAN_WORKSPACES));
}

function saveWorkspaces(){
	window.localStorage.setItem(KANBAN_WORKSPACES, JSON.stringify(workspaces));
}

function getWorkspaceName(){
	return KANBAN_WORKSPACES+"."+currentWorkspace;
}

function restoreTasks(){	
	tasks = JSON.parse(window.localStorage.getItem(getWorkspaceName()));
}

function saveTasks(){
	window.localStorage.setItem(getWorkspaceName(), JSON.stringify(tasks));
}

function initializeKanbanData(){
	if(typeof window.localStorage.getItem(KANBAN_WORKSPACES) === "undefined" ||
		window.localStorage.getItem(KANBAN_WORKSPACES) == null){
		workspaces = {"default":"Default Workspace"};
		saveWorkspaces();
	}else{
		restoreWorkspaces();
	}		

	if(typeof window.localStorage.getItem(getWorkspaceName()) === "undefined" || 
		window.localStorage.getItem(getWorkspaceName()) == null){	
		saveTasks();		
	}else{
		restoreTasks();	
	}
}

function renderWorkspacesMenu(){
	workspaces = JSON.parse(window.localStorage.getItem(KANBAN_WORKSPACES));	
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
	var $div = $("<div>", {id: id, class: "task"});
	$div.append("<h3>"+task.title+"</h3>");
	$div.append("<p>"+task.description+"</p>");
	$div.append("<span class='task-action task-edit glyphicon glyphicon-pencil' aria-hidden='true'></span>&nbsp;");
	$div.append("<span class='task-action task-remove glyphicon glyphicon-remove' aria-hidden='true'></span>");
	$div.draggable(dragOptions);
	$("#"+task.state).append($div);
}

function redrawTask(id){
	var task = tasks[id];
	$div = $("#"+id);
	$div.find("h3").html(task.title);
	$div.find("p").html(task.description);
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
	
	lastTask = 0;	
	
	var title = "Kanban - "+workspaces[currentWorkspace];	
	document.title = title;
	$("#title").html(title);

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
	clone.width($(this).outerWidth());
	return clone;
}

function onStartDragTask( event, ui ) {
	draggedTask = event.currentTarget;
	de = draggedTask.parentElement.id;
	$(draggedTask).addClass('dragged');
}

function onStopDragTask(event, ui) {						
	$(draggedTask).removeClass('dragged');	
}

function onDropTask(event, ui) {												
	para = this.id;
	if(de != para){
		var id = $(ui.draggable).attr("id");														
		tasks[id].state = para;								
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
	var workspaceName = prompt(MESSAGES["workspace_new"]);
	if(workspaceName){
		var workspaceId = workspaceName.replace(/\s/g, '');
		workspaces[workspaceId] = workspaceName;
		saveWorkspaces();
		renderWorkspacesMenu();
	}
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
			tasks[id] = {"title":title, "description":description, "state":"todo"};											
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

function onClickExport(){		
	$("#inputExportJson").val(JSON.stringify(tasks));		
	showModal("modalExport")
}

function onClickImport(){				
	$("#inputImportJson").val("");
	showModal("modalImport")
}

function onMouseOverTask(){
	$(this).find(".task-action").show();
}

function onMouseOutTask(){
	$(this).find(".task-action").hide();
}

function onClickBtnImportOk(){
	try {			
    	var tasksTemp = JSON.parse($("#inputImportJson").val());
    	if(confirm(message("confirm_import_tasks"))){
			tasks = tasksTemp;
			saveTasks();
			redrawKanban();
    		hideModals();        		
    		return true;
    	}
	} catch (e) {
		alert(message("error_invalid_json"));
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
	currentWorkspace = $(this).attr("id");			
	restoreTasks();
	redrawKanban();
}