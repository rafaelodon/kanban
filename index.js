var KANBAN_WORKSPACES = "kanban.workspaces";
var workspaces = {}
var tasks = {}
var currentWorkspace = "default";
var currentTaskId = null;
var lastTask = 1;
var de = null;
var para= null;
var draggedTask = null;

$(function (){ 				

	$('#linkNewWorkspace').click(onClickCreateNewWorkspace);

	$('.task').draggable(dragOptions);	

	$('.column').droppable({
		drop: function(event, ui) {												
			para = this.id;
			if(de != para){
				var id = $(ui.draggable).attr("id");														
				tasks[id].state = para;								
				drawTask(id);				
				saveTasks();			
				ui.draggable.remove();				
			}

		}
	});	

	$("#btnAddTask").click(function (){
		currentTaskId = null;
		$("#modalTask h2").html("Add Task");
		$("#inputTaskTitle").val(null);
		$("#inputTaskDescription").val(null);
		showModal("modalTask")		
		$("#inputTaskTitle").focus();
	});


	$('#btnTaskCancel').click(function() { 
	   	hideModals();
	    return false;
	});

	$("#btnTaskOk").click(function () {
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
	});	

	redrawKanban();

	$(".column").on("click", ".task-remove", function(e){ 
		id = e.target.parentElement.id;
		if(confirm("Removing task '"+tasks[id].title+"'. Are you sure?")){			
			delete tasks[id];
			saveTasks();
			$("#"+id).remove();
		}
	});

	$(".column").on("click", ".task-edit", function(e){ 
		var id = e.target.parentElement.id;
		$("#modalTask h2").html("Edit Task");
		$("#inputTaskTitle").val(tasks[id].title);
		$("#inputTaskDescription").val(tasks[id].description);
		showModal("modalTask"); 
		$("#inputTaskTitle").focus();
		currentTaskId = id;
	});

	$("#export").click(function (){		
		$("#inputExportJson").val(JSON.stringify(tasks));		
		showModal("modalExport")
	});

	$("#import").click(function (){				
		$("#inputImportJson").val("");
		showModal("modalImport")
	});

	$(".column").on("mouseover", ".task", function (){
		$(this).find(".task-action").show();
	});

	$(".column").on("mouseout", ".task", function (){
		$(this).find(".task-action").hide();
	});	

	$("#btnExportClose").click(function (){
		hideModals();
	});

	$("#btnImportCancel").click(function (){
		hideModals();
	});

	$("#btnImportOk").click(function (){
		try {			
        	var tasksTemp = JSON.parse($("#inputImportJson").val());
        	if(confirm("This Kanban tasks will be replaced by new ones. Are you sure?")){
				tasks = tasksTemp;
				saveTasks();
				redrawKanban();
        		hideModals();        		
        		return true;
        	}
    	} catch (e) {
    		alert("This is not a valid JSON.");
    		$("#inputImportJson").focus();
        	return false;
    	}    			
	});

	$('.nav a').on('click', function(){ 
        if($('.navbar-toggle').css('display') !='none'){
            $(".navbar-toggle").trigger( "click" );
        }
    });

    $(window).bind('beforeunload', function() {    	
        saveTasks();
        return "Salvando tarefas...";	    
	});

});

function onClickCreateNewWorkspace(){
	alert(false);
	var workspaceName = prompt("New workspace name:");
	if(workspaceName){
		var workspaceId = workspaceName.replace(/\s/g, '');
		workspaces[workspaceId] = workspaceName;
		saveWorkspaces();
		renderWorkspacesMenu();
	}
}

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
	alert(getWorkspaceName());
	tasks = JSON.parse(window.localStorage.getItem(getWorkspaceName()));
}

function saveTasks(){
	window.localStorage.setItem(getWorkspaceName(), JSON.stringify(tasks));
}

function initializeKanban(){
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

		var $a = $("<a>", {href: "#"});
		$a.html(workspaces[w]);

		$a.click(function (){
			alert(w);
			currentWorkspace = w;
			restoreTasks();
			redrawKanban();
		});

		var $li = $("<li>", {class: "liWorkspace"});
		$li.append($a);

		$("#ulWorkspaces").append($li);
	}
}

initializeKanban();
renderWorkspacesMenu();

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

function downloadJson(){
	return "data:" + JSON.stringify(tasks);
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
	$(".task").remove();	
	for(var t in tasks){
		var idNum = parseInt(t.replace(/t/g,''));
		if(idNum > lastTask){
			lastTask = idNum;			
		}		
		drawTask(t);
	};
}

dragOptions = {
	containment: 'window',
	helper: function(){				
		clone = $(this).clone();
		clone.addClass('dragging');
		clone.width($(this).outerWidth());
		return clone;
	},
	start: function( event, ui ) {
		draggedTask = event.currentTarget;
		de = draggedTask.parentElement.id;
		$(draggedTask).addClass('dragged');
	},
	stop: function (event, ui) {						
		$(draggedTask).removeClass('dragged');	
	}
};