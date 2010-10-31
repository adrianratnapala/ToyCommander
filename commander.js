// -- Pluggable --------------------------------------

var builtins = {       
}

// Converts command line text to a URL.
function commandToURI(session, command) {
        if( !command )
                return;

        word0 = command.replace( /^\s*(\S+).*/, '$1');

        var b = builtins[word0];
        if(b) 
                return b(session, word0, command);

        return encodeURI(word0);
}

// Creates command prompt (also used in pane header bars).
function createPrompt(session) {
        return document.createTextNode(session.command_id + '$ ');
}

// -- Core -------------------------------------------

// A pane to hold an executed command and its results.
function Pane(session, text) 
{
        this.id = session.command_id;

        var prspan = document.createElement('span');
        prspan.setAttribute( 'class', 'oprompt' );
        prspan.appendChild( createPrompt(session) );

        var input = document.createElement('span');
        input.setAttribute('class','input');
        input.appendChild( document.createTextNode(text) );
 
        var command = document.createElement('div');
        this.command = command;
        command.setAttribute('class', 'ocommand');
        command.appendChild( prspan );
        command.appendChild( input );

        // create a pane to return results into. 
        this.pane     = document.createElement('div');
        this.pane.setAttribute('class', 'pane');
        this.pane.appendChild( command );

        // Closures really are very cool.
        command.onmouseout = function() {
                this.setAttribute('class', 'ocommand');
        }
        command.onmouseover = function() {
                this.setAttribute('class', 'hcommand');
        }
        this.hide = function() {
                this.pane.removeChild( this.receiver );
                command.onclick = this.show;
        }
        this.show = function () {
                if( this.receiver ) {
                        this.pane.appendChild( this.receiver );
                        command.onclick = this.hide;
                }
        }
}
 
// Request uri and call gotit on the result.
function requestURI(uri, gotit) {
        var xml_http = new XMLHttpRequest();

        function html_to_DOM(error, html) {
                DOM = document.createElement('div');
                DOM.setAttribute('class', error ? 'error' : 'response');
                DOM.innerHTML = html;
                return DOM;
        }

        /* request results from server. */
        xml_http.onreadystatechange = function(){
                switch(this.readyState) {
                case 4:
                        gotit(html_to_DOM(this.status!=200,
                                          this.responseText));
                }
        }

        try {
                xml_http.open('GET', uri, true);
                xml_http.send();
        } catch (e) {
                if(!e.code) { throw e; }
                gotit( html_to_DOM( true,
                        'REQUEST "' + uri + '" FAILED ['
                                          + e.code +']: '
))                                        + e.message;
        }
}


// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( session, text, gotit_cb ) {
        pane = new Pane(session, text);
        receiver = pane.receiver;

        function gotit() { 
                pane.show();
                if(gotit_cb) 
                        gotit_cb(pane.receiver); 
        }

        if( uri  = commandToURI(session, text) ) {
                requestURI( uri, function(resp) {
                        if(pane.receiver)
                                pane.pane.replaceChild(resp, pane.receiver );
                        pane.receiver = resp;
                        gotit();
                })
        } else {
                gotit();
        }

        ++session.command_id;
        return pane;
}

// Create user's command line input widget for session.
function commandInput(session) {
        var prspan = document.createElement('span');
        var prompt = createPrompt(session)
        prspan.setAttribute( 'class', 'prompt' );
        prspan.appendChild( prompt );
        session.commander.appendChild( prspan );

        var input = document.createElement('input');
        input.setAttribute('type', 'input');
        input.setAttribute('class','command');
        
        session.commander.appendChild( input );

        function enter(ev) { // Handle user hitting ENTER
                var old_prompt = prompt;
                prompt = createPrompt(session);
                prspan.replaceChild( prompt, old_prompt );

                // FIX: Naming
                pane = runCommand(session, input.value, function(){
                        input.focus();
                        window.scrollTo(0, input.offsetTop);
                })
                session.container.insertBefore(pane.pane, session.commander);
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
        this.command_id = 0;
        this.container = container;

        // The HTML form for the input line + accessories 
        this.commander = document.createElement('div');
        this.commander.setAttribute('class', 'command');

        this.input_text = commandInput(this)
        
        this.container.appendChild(this.commander);

        input_text.focus();
}

window.onload = function(){ Session(document.body); }

