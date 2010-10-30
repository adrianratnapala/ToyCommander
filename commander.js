
// Runs the string "text", returns an DIV to catch the results. 
function runCommand( text ) {
        var pane    = document.createElement('div');
        var frame   = document.createElement('iframe');

        frame.setAttribute('src', 'jabber.html');
        frame.onload = function(){
                frame.height = 
                        frame.contentDocument.body.scrollHeight;
        }

        pane.appendChild( document.createTextNode(text) );
        pane.appendChild( document.createElement('br') );
        pane.appendChild(frame);
        return pane;
}

// Create user's command line input widget. 
function commandInput(commander) {
        var input = document.createElement('input');

        input.setAttribute('type', 'input');
        input.setAttribute('name', 'input');
        input.onkeydown = function(ev) {
                if ( ev.keyCode != 13 /*RETURN*/ ) 
                        return;
                pane = runCommand(this.value);
                
                document.body.insertBefore( pane, commander.toplevel );
                input.focus();
                return false; // swallow event, don't submit.
        }

        return input;
}

// Constructs the whole command widget, including the text input. 
function Commander(prev) { 
        this.toplevel = document.createElement('div');
        var command_form = document.createElement('form');
        var input_text = commandInput(this)

        command_form.appendChild( input_text );
        toplevel.appendChild( command_form );
        document.body.appendChild(this.toplevel);

        input_text.focus();
}

window.onload = function() {
        Commander();
}

