// Converts command line text to a URL.
function commandToURI(command) {
        if( !command )
                return;
        
        word0 = command.replace( /^\s*(\S+).*/, '$1');
        return encodeURI(word0);
}

// Request uri and place the result inside receiver. Call gotit once done.
function requestURI(receiver, uri, gotit) {
        var xml_http = new XMLHttpRequest();

        /* request results from server. */
        xml_http.onreadystatechange = function(){
                switch(this.readyState) {
                case 4:
                        receiver.innerHTML = this.responseText;
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
                receiver.setAttribute('class', 'error');
                receiver.innerHTML = 'REQUEST "' + uri + '" FAILED ['
                                                 + e.code +']: '
                                                 + e.message;
                gotit();
        }
}

// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( text, gotit_cb ) {
        // create a pane to return results into. 
        var pane     = document.createElement('div');
        pane.setAttribute('class', 'pane');
        var receiver = document.createElement('div');
        receiver.setAttribute('class', 'response');

        var command = document.createElement('div');
        command.setAttribute('class', 'command');
       
        command.appendChild( document.createTextNode(text) );
        pane.appendChild( command );
        pane.appendChild( receiver );
        
        function gotit() {
                if(gotit_cb)
                        gotit_cb(receiver);
        }
        
        if( uri  = commandToURI(text) ) {
                requestURI( receiver, commandToURI(text), gotit );
        } else {
                gotit();
        }

        return pane;
}

// Create user's command line input widget for session.
function commandInput(session) {
        var input = document.createElement('input');

        input.setAttribute('type', 'input');
        input.setAttribute('class','command');

        function enter(ev) { // Handle user hitting ENTER
                pane = runCommand(input.value, function(){
                        input.focus();
                        window.scrollTo(0, input.offsetTop);
                })
                session.container.insertBefore(pane, session.commander);
        }

        input.onkeydown = function(ev) { // Filter user keystrokes
                switch ( ev.keyCode ) {
                case 13 /*RETURN*/:
                        try { enter(ev); } 
                        catch(e) { alert(e); }
                        finally { return false; }
                }
        }

        return input;
}

// The Session object holds the command line and old results.
function Session(container) { 
        this.container = container;

        // The HTML form for the input line + accessories 
        this.commander = document.createElement('form');
        this.commander.setAttribute('class', 'command');

        this.input_text = commandInput(this)
        this.commander.appendChild( this.input_text );
        
        this.container.appendChild(this.commander);

        input_text.focus();
}

window.onload = function(){ Session(document.body); }

