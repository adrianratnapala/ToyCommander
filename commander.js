
// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( text, responder ) {
        /* create a pane to return results into. */
        var pane    = document.createElement('div');
        pane.setAttribute('class', 'pane');
        var resp    = document.createElement('div');
        resp.setAttribute('class', 'response');

        var command = document.createElement('div');
        command.setAttribute('class', 'command');
       
        command.appendChild( document.createTextNode(text) );
        pane.appendChild( command );
        pane.appendChild( resp );

        /* request results from server. */
        var xml_http = new XMLHttpRequest();
        xml_http.open('GET', 'jabber.html', true);
        xml_http.onreadystatechange = function(){
                if (this.readyState != 4)
                        return;
                responder( resp, this.responseText );
        }
        xml_http.send();
        
        return pane;
}

// Create user's command line input widget. 
function commandInput(commander) {
        var input = document.createElement('input');

        input.setAttribute('type', 'input');
        input.setAttribute('name', 'input');
        input.setAttribute('class','command');

        responder = function( resp, text ) {
                resp.innerHTML = text;
                input.focus();
                window.scrollTo(0, input.offsetTop);
        }  

        input.onkeydown = function(ev) {
                if ( ev.keyCode != 13 /*RETURN*/ ) 
                        return;
                
                try {
                        pane = runCommand(this.value, responder);

                        document.body.insertBefore( pane, commander.toplevel );
                        input.focus();
                } finally {
                        return false; // swallow event, don't submit.
                }
        }

        return input;
}

// Constructs the whole command widget, including the text input. 
function Commander(prev) { 
        this.toplevel = document.createElement('div');
        var command_form = document.createElement('form');
        var input_text = commandInput(this)

        this.toplevel.setAttribute('class', 'command');
        command_form.appendChild( input_text );
        toplevel.appendChild( command_form );
        document.body.appendChild(this.toplevel);

        input_text.focus();
}

window.onload = function() {
        Commander();
}

