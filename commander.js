// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( text, cb ) {
        /* create a pane to return results into. */
        var pane    = document.createElement('div');
        var resp    = document.createElement('div');
        pane.appendChild( document.createTextNode(text) );
        pane.appendChild( resp );

        /* request results from server. */
        var xml_http = new XMLHttpRequest();
        xml_http.open('GET', 'jabber.html', true);
        xml_http.onreadystatechange = function(){
                if (this.readyState != 4)
                        return;
                resp.innerHTML = this.responseText;
                if(cb)
                        cb(resp, this);
        }
        xml_http.send();
        
        return pane;
}

// Create user's command line input widget. 
function commandInput(commander) {
        var input = document.createElement('input');

        input.setAttribute('type', 'input');
        input.setAttribute('name', 'input');

        function enter(ev) {
                pane = runCommand(this.value, function(){
                        input.focus();
                        window.scrollTo(0, input.offsetTop);
                })
                document.body.insertBefore(pane, commander.toplevel);
                this.focus();
        }

        input.onkeydown = function(ev) {
                switch ( ev.keyCode ) {
                case 13 /*RETURN*/:
                        try { enter(ev); } 
                        finally { return false; }
                }
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

