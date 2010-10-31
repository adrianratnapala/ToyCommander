// Converts command line text to a URL.
function commandToURI(command) {
        if( !command )
                return;
        
        word0 = command.replace( /^\s*(\S+).*/, '$1');
        return encodeURI(word0);
}

// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( text, gotit_cb ) {
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

        var xml_http = new XMLHttpRequest();

        function gotit() {
                if(gotit_cb)
                        gotit_cb(resp, xml_http);
        }

        if( !(uri = commandToURI(text)) )
                return gotit();

        /* request results from server. */
        xml_http.onreadystatechange = function(){
                switch(this.readyState) {
                case 4:
                        resp.innerHTML = this.responseText;
                        gotit()
                }
        }

        try {
                xml_http.open('GET', uri, true);
                xml_http.send();
        } catch(e) {
                if(!e.code) {
                        throw e;
                }
                resp.setAttribute('class', 'error');
                resp.innerHTML = 'REQUEST FAILED [' + e.code +']: '
                                                    + e.message;
                gotit();
        }
        
        return pane;
}

// Create user's command line input widget. 
function commandInput(commander) {
        var input = document.createElement('input');

        input.setAttribute('type', 'input');
        input.setAttribute('name', 'input');
        input.setAttribute('class','command');

        function enter(ev) {
                pane = runCommand(input.value, function(){
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
                        catch(e) {
                                alert(e);
                        }
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

        this.toplevel.setAttribute('class', 'command');
        command_form.appendChild( input_text );
        toplevel.appendChild( command_form );
        document.body.appendChild(this.toplevel);

        input_text.focus();
}

window.onload = function() {
        Commander();
}

