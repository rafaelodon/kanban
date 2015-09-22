var MESSAGES = {
	"workspace_new":"New workspace name teste:",
	"confirm_remove_task":"Removing task {1}. Are you sure?",
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