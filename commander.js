var builtins = {
        'echo' : function(id, text, words) {
                return { html : words.slice(1).join(' ' ) }
        },
        'e-cho': function(id, text, words) {
                return { html : words.slice(1).join('-' ), error:true }
        },
        'oche' : function(id, text, words) {
                return { html : words.slice(1).reverse().join(' ' ) }
        }
}

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

function responseToDOM(response) {
        var DOM = document.createElement('div');
        DOM.setAttribute('class', response.error ? 'error' : 'response')
        DOM.innerHTML = response.html;
        return DOM
}

// Finds a way to run the string "text" then calls gotit(responseDOM)
function runCommand( id, text, gotit ) {
        var words = text.replace('/\s+/g', ' ').split(' ');

        if (!words || words[0]=='')  
                return gotit(null);

        if(fun = builtins[words[0]])
                return gotit(responseToDOM(fun(id, text, words)) )
         
        ajaxGET( encodeURI(words[0]), function(ajax, e) {
                return gotit( responseToDOM({
                        html : ajax.responseText,
                        error: e,
                   }))
        })
}

//-------------------------------------------------------

// hold output results and command bar (similar to a title bar)
function Pane(session) {
        var command_text = this.command_text = session.input.DOM.value
        var id = this.id = session.command_id

        // represent it: FIX: rationalise the CSS classses
        var promptDOM = document.createElement('span');
        promptDOM.setAttribute( 'class', 'prompt' );
        promptDOM.appendChild( makePrompt(session) );

        var bannerDOM = document.createElement('span');
        bannerDOM.setAttribute('class','command');
        bannerDOM.appendChild( document.createTextNode(command_text) );
 
        var snapDOM = document.createElement('div');
        snapDOM.setAttribute('class', 'snap');
        snapDOM.appendChild( promptDOM );
        snapDOM.appendChild( bannerDOM );

        var DOM = this.DOM = document.createElement('div');
        DOM.setAttribute('class', 'pane');
        DOM.appendChild( snapDOM );

        // callbacks/methods -- session is no longer frozen

        var contentDOM = null, shownDOM = null
        snapDOM.onclick = function() {
                if(!contentDOM)
                        return
                if(!shownDOM) 
                        return DOM.appendChild(shownDOM = contentDOM)
                DOM.removeChild(shownDOM)
                shownDOM = null
        }

        this.go = function(gotit){
                runCommand(id, command_text, function(respDOM){
                        if(respDOM) 
                                DOM.appendChild(contentDOM=shownDOM=respDOM)
                        gotit()
                })
        }
}

//-------------------------------------------------------

// FIX: we are losing the naming battle.
function Input(DOM, go) {
        this.DOM = DOM
        DOM.onkeyup = function(ev) { 
                var prefix = this.value.slice(0, DOM.selectionStart)
                // and do something with the suggestion box
        }
 
        DOM.onkeydown = function(ev) { // Filter user keystrokes
               switch ( ev.keyCode ) {
               case 13 /*RETURN*/:
                        try { go(); } 
                        catch(e) { alert(e); }
                        finally { return false; }
                }
        }
}

function Session(liveDOM, promptDOM, inputDOM) {
        var session = this
        var containerDOM = document.body
        var input = this.input = new Input(inputDOM, go)
        this.command_id = 0

        function focus() {
                input.DOM.focus();
                window.scrollTo(0, liveDOM.offsetTop);
        }

        function go() {
                var pane = new Pane(session)
                session.command_id++

                containerDOM.insertBefore(pane.DOM, liveDOM)
                promptDOM.replaceChild(makePrompt(session), 
                                       promptDOM.firstChild)
                pane.go(focus)
        }

        containerDOM.onkeydown = focus /*start typing in the right place*/

        promptDOM.replaceChild(makePrompt(session), promptDOM.firstChild)
        focus()
}

session = new Session(
                document.getElementById('command'),
                document.getElementById('prompt'),
                document.getElementById('input')
               );

