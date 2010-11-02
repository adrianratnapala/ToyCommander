function makePrompt(session) {
        return document.createTextNode( session.command_id + '$ ' );
}

//-------------------------------------------------------
 
// Request uri and call gotit(xmlHTTP, error) on the result.
function ajaxGET(uri, gotit) {
        // FIX: crazy error return type.
        var ajax = new XMLHttpRequest();

        /* Request results from server. */
        ajax.onreadystatechange = function() {
                if(this.readyState == 4) {
                        var status = ajax.status
                        gotit(ajax, (status==200) ? false : status)
                }
        }

        try {
                ajax.open('GET', uri, true);
                ajax.send();
        } catch (e) {
                if(!e.code) throw e;
                else gotit(null, e)
        }
}

// Runs the string "text", calls gotit(responseDOM)
function runCommand( id, text, gotit ) {
        var words = text.replace('/\s+/g', ' ').split(' ');
        if (!words || words[0]=='')  
                return gotit(null);
         
        ajaxGET( encodeURI(words[0]), function(ajax, e) {
                var respDOM = document.createElement('div');
                respDOM.setAttribute('class', e ? 'error' : 'response')
                respDOM.innerHTML = ajax.responseText;
                gotit(respDOM)
        })
}


//-------------------------------------------------------

// hold output results and command bar (similar to a title bar)
function Pane(session) {
        // snapshot the session
        var text = session.input.value
        var prompt_text_node = makePrompt(session)
        var id = session.command_id

        // represent it: FIX: rationalise the CSS classses
        var prompt = document.createElement('span');
        prompt.setAttribute( 'class', 'oprompt' );
        prompt.appendChild( prompt_text_node );

        var input = document.createElement('span');
        input.setAttribute('class','input');
        input.appendChild( document.createTextNode(text) );
 
        var command_bar = document.createElement('div');
        command_bar.setAttribute('class', 'ocommand');
        command_bar.appendChild( prompt );
        command_bar.appendChild( input );

        var DOM = document.createElement('div');
        DOM.setAttribute('class', 'pane');
        DOM.appendChild( command_bar );
        this.DOM = DOM

        this.go = function(gotit){
                runCommand(id, text, function(respDOM){
                        if(respDOM) 
                                DOM.appendChild(respDOM)
                        gotit()
                })
        }
}

//-------------------------------------------------------

function Session(command, prompt, input) {
        var container = document.body
        var session = this
        this.command = command
        this.prompt = prompt
        this.input = input
        this.command_id = 0
        

        function focus() {
                input.focus();
                window.scrollTo(0, session.command.offsetTop);
        }

        function go() {
                var pane = new Pane(session)
                session.command_id++

                container.insertBefore(pane.DOM, command)
                prompt.replaceChild(makePrompt(session), prompt.firstChild)
                pane.go(focus)
        }

        input.onkeyup = function(ev) { 
                var prefix = input.value.slice(0, input.selectionStart)
                // and do something with the suggestion box
        }
 
        input.onkeydown = function(ev) { // Filter user keystrokes
               switch ( ev.keyCode ) {
               case 13 /*RETURN*/:
                        try { go(); } 
                        catch(e) { alert(e); }
                        finally { return false; }
                }
        }

        prompt.replaceChild(makePrompt(session), prompt.firstChild)
        focus()
}

session = new Session(
                document.getElementById('command'),
                document.getElementById('prompt'),
                document.getElementById('input')
               );

