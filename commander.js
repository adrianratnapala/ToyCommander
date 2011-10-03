/* Builtin commands: maps command name strings to functions which
   directly execute them.  Each function takes inputs
        id:    The command_id, aka what incrments when the user hits enter.
        text:  Full text of the command line.
        words: Command line split into whitespace separated words.      

   Each one outputs
        html:  The response to present to the user (in HTML format)
        error: If true, the result is somehow an error.
*/
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

/* Given the current session status, return a command prompt string. */
function makePrompt(session) 
{
        return session.command_id + '$ ';
}

//-------------------------------------------------------
 
// Request uri and call gotit(xmlHTTP, error) on the result.
function ajaxGET(uri, gotit) 
{
        var ajax = new XMLHttpRequest();

        /* Request results from server. */
        ajax.onreadystatechange = function() {
                if(this.readyState == 4) 
                        gotit(ajax, (ajax.status==200) ? false : ajax.status)
        }

        try {
                ajax.open('GET', uri, true);
                ajax.send();
        } catch (e) {
                if(!e.code) throw e;
                else gotit(null, e)
        }
}

// Convert an ajaxGET result into a DIV, coloured red if it's a error 
function responseToDOM(response) {
        var DOM = document.createElement('div');
        DOM.setAttribute('class', response.error ? 'error' : 'response')
        DOM.innerHTML = response.html;
        return DOM
}

/*
  Executes command text, runs gotit on the result.  Execute means:

   DO NOTHING      (except call gotit), if there is no non-whitespace text
   EXECUTE BUILTIN if the first word of text is a builtin, otherwise
   FETCH THE URI   derived b encoding the first word.
*/
function runCommand( id, text, gotit ) {
        var words = text.split(/\s+/);

        if (!words || words[0]=='')  
                return gotit(null);

        if(fun = builtins[words[0]])
                return gotit(responseToDOM(fun(id, text, words)))
         
        ajaxGET( encodeURI(words[0]), function(ajax, e) {
                return gotit( responseToDOM({
                        html : ajax ? ajax.responseText : ''+e,
                        error: e,
                   }))
        })
}

/*
  Pane object - the record of a previously executed command.  

  A pane comprises (a) a "snapshot" which displays that command's prompt and
  command text and (b) and a content area, which is whatever DOM object was
  returned as result of the command.  Clicking the snapshot toggles the content
  area in and out of sight.  This constructor takes an "input" object,
  describing a not-yet-run command, saves some if its contents as a Pane
  object, executes the command and displays the results.
*/
function Pane(input, gotit) {
        var command_text = this.command_text = input.DOM.value
        var id = this.id = input.id

        // snapshot = prompt banner
        /* FIX: shall it stay or shall it go?
        var promptDOM = document.createElement('span');
        promptDOM.setAttribute( 'class', 'prompt' );
        promptDOM.appendChild( makePrompt(session) );

        var bannerDOM = document.createElement('span');
        bannerDOM.setAttribute('class','command');
        bannerDOM.appendChild( command_text.replace(/\s+/g, '') ?
                        document.createTextNode(command_text) :
                        document.createElement('span') 
                        );
                */
        var pt = makePrompt(session) // FIX: do not use session
        var ct = command_text.replace(/\s+/g, '') ? 
                        command_text : '<span></span>'
        var snapDOM = document.createElement('div');
        snapDOM.setAttribute('class', 'snap');
        snapDOM.innerHTML = "<span class=prompt>" + pt + "</span>" +
                            "<span class=command>" + ct + "</span>"

        /* FIX: shall it stay or shall it go?
        snapDOM.appendChild( promptDOM );
        snapDOM.appendChild( bannerDOM );
        */

        // pane == [prompt response]
        var DOM = this.DOM = document.createElement('div');
        DOM.setAttribute('class', 'pane');
        DOM.appendChild( snapDOM );
        
        var contentDOM = null, shownDOM = null
        runCommand(id, command_text, function(respDOM){
                if(respDOM) DOM.appendChild(contentDOM=shownDOM=respDOM)
                if(gotit) gotit()
        })

        // make the snapshot clickable
        snapDOM.onclick = function() {
                if(!contentDOM) return
                if(!shownDOM) return DOM.appendChild(shownDOM = contentDOM)
                DOM.removeChild(shownDOM)
                shownDOM = null
        }
}

//-------------------------------------------------------

/* if a == null, return b.  Otherwise return the common stem of both. ??? */
function streq(a,b) {
        if( a == null )
                return b

        // FIX: surely there is a better way to implement  this.
        var chars=[]
        for (var k=0; k < a.length && a[k] == b[k]; k++) 
                chars.push( a[k] )
        return chars.join('')
}

function filterHelp(rdb, db, segs) {
        if( !segs.length || !db )
                return []
        
        var text = segs[0]
        var ilist=[]
        if (segs.length==1) {
                for( var k in db.items )
                        if( k.slice(0, text.length) == text)
                                ilist.push([k, db.items[k]])
        } else if( db.items[text] ) {
                for( var ci in db.cont ) { 
                        var sub_db = rdb[db.cont[ci]]
                        var ssegs = segs.slice(1)
                        var nl = filterHelp(rdb, sub_db, ssegs)
                        ilist = ilist.concat(nl)
                }
        }
        return ilist
        
}

function Helper (helpDOM) {
        var emptyDOM = document.createTextNode('')
        while(helpDOM.firstChild)
                helpDOM.removeChild(helpDOM.firstChild);
        var suggDOM=helpDOM.appendChild( document.createElement('div') )
        var descDOM=helpDOM.appendChild(document.createElement('div'))
        descDOM.appendChild(emptyDOM)

        helpDOM.onmouseout = function() {
                descDOM.replaceChild( emptyDOM, descDOM.firstChild )
        }

        helpDOM.appendChild(document.createElement('div'))

        function makeHelpItem(k, help) {
                var cDOM = document.createElement('span')
                var ttDOM = document.createTextNode(k)
                var thDOM = document.createTextNode(help)

                cDOM.appendChild(ttDOM)
                cDOM.setAttribute('class', 'help-entry')

                cDOM.onmouseover = function() {
                        descDOM.replaceChild( thDOM, descDOM.firstChild )
                }
                return cDOM
        }

        var prefix = ''
        var help_db = ''
        var sync = this.sync = function(new_help_db, new_prefix) {
                if( typeof(new_prefix) == 'string' ) prefix=new_prefix
                if( new_help_db ) help_db = new_help_db

                var segs = prefix.split(/\s/)
                var dlist = filterHelp(help_db, help_db, segs)
                var newsuggDOM = document.createElement('div')
                for (d in dlist) {
                        de = dlist[d]
                        newsuggDOM.appendChild(makeHelpItem(de[0], de[1]))
                }
                suggDOM = helpDOM.replaceChild(newsuggDOM, suggDOM)
                suggDOM = newsuggDOM
        }

        var continueFrom = this.continueFrom = function(prefix) {
                var ext = null;
                var segs = prefix.split(/\s/)
                dlist = filterHelp(help_db, help_db, segs)
                if ( dlist.length == 1 )
                        ext = dlist[0][0] + ' '
                else for(k in dlist) 
                        ext = streq(ext, dlist[k][0])
                return prefix + ext.slice(segs.pop().length)
        }

        var ajax_help = []
        ajaxGET( 'help.json', function(ajax, error) {
                console.log(ajax)
                console.log(error)
                if( ajax && !error ) {
                        eval('ajax_help = ' + ajax.responseText)
                        sync(ajax_help)
                }
        })
}

function history(session, DOM, ev) {
        var prefix = DOM.value

        function match(idx) {
                var pane = session.panes[idx]
                var text = pane.command_text
                if( text.replace(/\s/, '') == '' )
                        return null
                if( text.slice(0, prefix.length) != prefix )
                        return null
                return text
        }

        var u
        var idx = session.panes.length
        var retkd = DOM.onkeydown
        var kd = DOM.onkeydown = function(ev) {
                switch ( ev.keyCode ) {
                case 38/*UP*/: 
                        u = DOM.value
                        while(idx > 0 && !(u=match(--idx)));
                        break
                case 40/*UP*/: 
                        u = prefix
                        while( (idx+1) < session.panes.length  &&
                              !(u=match(++idx)));
                        break

                default :  
                        DOM.onkeydown = retkd
                        break
                }
                DOM.value = u
                DOM.setSelectionRange(u.length, u.length)
                return false
        }

        kd(ev)
        return false
}

function Input(session, DOM, go) {
        this.DOM = DOM
        this.id = session.command_id
        input = this

        helper = new Helper(session.helpDOM)

        var focus = session.containerDOM.onkeydown = function() {
                input.DOM.focus();
                window.scrollTo(0, session.liveDOM.offsetTop);
        }
 
        var suggest = DOM.onkeyup = function() {
                helper.sync(null,  DOM.value.slice(0, DOM.selectionStart))
        }
                      
        var tabcontinue = function() {
                var prefix = DOM.value.slice(0, DOM.selectionStart)
                prefix = helper.continueFrom(prefix);
                if(prefix) {
                        DOM.value = prefix + 
                                DOM.value.slice(DOM.selectionStart)
                        return false
                }
        }

        DOM.onkeydown = function(ev) { // Filter user keystrokes
               switch ( ev.keyCode ) {
               case 13 /*RETURN*/:
                        try { 
                                var pane = new Pane(input, focus)
                                DOM.value = ''
                                go(pane); 
                        } 
                        catch(e) { alert(e); }
                        finally { return false; }
               case  9 /*TAB*/ : return tabcontinue()
               case 38 /*UP*/  : return history(session, DOM, ev)
               }
        }

        var pDOM = session.promptDOM
        var ptextDOM = document.createTextNode(makePrompt(session))
        pDOM.replaceChild(ptextDOM, pDOM.firstChild)
        focus()
}

function Session(liveDOM, promptDOM, inputDOM, helpDOM) {
        var session = this
        var input = null
        var containerDOM = this.containerDOM = document.body
        var panes = this.panes = []
        this.command_id = 0
        this.liveDOM = liveDOM
        this.helpDOM = helpDOM
        this.promptDOM = promptDOM

        function go(pane) {
                panes.push(pane)
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

