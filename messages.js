var MESSAGES = {
	"workspace_new":"New workspace name:",
	"workspace_rename":"Inform a new name to the current workspace:",	
	"confirm_workspace_remove":"Removing workspace {1} and all its tasks. Are you sure?", 
	"confirm_remove_task":"Removing task {1}. Are you sure?",
	"confirm_archive_task":"Archiving task {1}. Are you sure?",
	"confirm_import_tasks":"All tasks from the current workspace will be be replaced by new ones. Are you sure?",
	"error_invalid_json":"This is not a valid JSON.",
}

function message(key){
	var msg = MESSAGES[key];	
	if(msg){		
		for (var i = 1; i < arguments.length; i++) {
    		msg = msg.replace("{"+i+"}",arguments[i]);    		
  		}
  		return msg;
  	}else{
  		throw new Error("Could not find the message '"+key+"'.");
  	}  	  	
}
