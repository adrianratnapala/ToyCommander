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
function Pane(input, gotit) {
        var command_text = this.command_text = input.DOM.value
        var id = this.id = input.id

        // represent it: FIX: rationalise the CSS classses
        var promptDOM = document.createElement('span');
        promptDOM.setAttribute( 'class', 'prompt' );
        promptDOM.appendChild( makePrompt(session) );

        var bannerDOM = document.createElement('span');
        bannerDOM.setAttribute('class','command');
        bannerDOM.appendChild( command_text.replace(/\s+/g, '') ?
                        document.createTextNode(command_text) :
                        document.createElement('span') 
                        );
 
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

        runCommand(id, command_text, function(respDOM){
                if(respDOM) DOM.appendChild(contentDOM=shownDOM=respDOM)
                if(gotit) gotit()
        })
}

//-------------------------------------------------------

function helpToSuggDOM(help, prefix, DOM) 
{
        if( !help )
                return
        var common=null
        for(var k in help ? help.items : []) {
                if( !k.match('^'+prefix))
                        continue
                common =streq(common, k)
                cDOM = document.createElement('span')
                cDOM.appendChild(document.createTextNode(k))
                cDOM.setAttribute('class', 'help-entry')
                DOM.appendChild(cDOM)
        }        
        return common
}

function streq(a,b) {
        if( a == null )
                return b

        var chars=[]
        for (var k=0; k < a.length && a[k] == b[k]; k++) 
                chars.push( a[k] )
        return chars.join('')
}

function Input(session, DOM, go) {
        this.DOM = DOM
        this.id = session.command_id
        input = this

        var help = null
        ajaxGET( 'help.json', function(ajax, error) {
                if( !error ) {
                        eval('help = ' + ajax.responseText)
                        suggest()
                }
        })
        
        function suggest() {
                var prefix  = DOM.value.slice(0, DOM.selectionStart)
                var suggDOM = document.createElement('div')

                for(re in help) {
                        if( prefix.match(re) )
                                helpToSuggDOM(help[re], prefix, suggDOM)
                }
                
                var helpDOM = session.helpDOM
                helpDOM.replaceChild(suggDOM, helpDOM.firstChild)
        }

        var focus = session.containerDOM.onkeydown = function() {
                input.DOM.focus();
                window.scrollTo(0, session.liveDOM.offsetTop);
        }
 
        DOM.onkeyup = function() { 
                suggest()
        }

        DOM.onkeydown = function(ev) { // Filter user keystrokes
               switch ( ev.keyCode ) {
               case 13 /*RETURN*/:
                        try { 
                                var pane = new Pane(input, focus)
                                go(pane); 
                        } 
                        catch(e) { alert(e); }
                        finally { return false; }
                }
        }

        var pDOM = session.promptDOM
        pDOM.replaceChild(makePrompt(session), pDOM.firstChild)
        suggest()
        focus()
}

function Session(liveDOM, promptDOM, inputDOM, helpDOM) {
        var session = this
        var input = null
        var containerDOM = this.containerDOM = document.body
        this.command_id = 0
        this.liveDOM = liveDOM
        this.helpDOM = helpDOM
        this.promptDOM = promptDOM

        function go(pane) {
                session.command_id++
                containerDOM.insertBefore(pane.DOM, liveDOM)
                input = session.input = new Input(session, inputDOM, go)
        }

        input = this.input = new Input(this, inputDOM, go)
}

session = new Session(
                document.getElementById('command'),
                document.getElementById('prompt'),
                document.getElementById('input'),
                document.getElementById('help')
               );

