// -- Pluggable --------------------------------------

/* FIX: what about non-text builtins? */
var builtins = {
        'echo' : function(_, words) {return words.slice(1).join(' ')},
        'e-cho' : function(_, words) {return words.slice(1).join('-')},
        'oche' : function(_, words) {return words.slice(1).reverse().join(' ')},
}

// Creates command prompt (also used in pane header bars).
function createPrompt(session) {
        return document.createTextNode(session.command_id + '$ ');
}

// -- Core -------------------------------------------

/* Enclose some HTML inside a surrounding DIV object */
function builtinCommand(session, words, text) {
        if(b = builtins[words[0]] ) {
                html = b(session, words, text);
                return htmlToDOM( false, html ? html : '' );
        }
}

function suggestionList(session, prefix) {
        var s = [];
        for (var k in builtins) {
                if ( prefix == k.slice(0, prefix.length) )
                        s.push(k);
        }
        return s
}

/* Enclose some HTML inside a surrounding DIV object */
function htmlToDOM(error, html) {
        DOM = document.createElement('div');
        DOM.setAttribute('class', error ? 'error' : 'response');
        DOM.innerHTML = html;
        return DOM;
}
 
// Request uri and call gotit on the result.
function requestURI(uri, gotit) {
        var xml_http = new XMLHttpRequest();

        /* request results from server. */
        xml_http.onreadystatechange = function(){
                switch(this.readyState) {
                case 4:
                        // FIX: what statuses are good and what aren't?
                        gotit(htmlToDOM(this.status && this.status!=200,
                                          this.responseText));
                }
        }

        try {
                xml_http.open('GET', uri, true);
                xml_http.send();
        } catch (e) {
                if(!e.code) { throw e; }
                gotit( html_to_DOM( true,
                        'REQUEST "' + uri + '" FAILED [' + e.code +']: '
                                          + e.message));
        }
}

// Pane widget ---------------------------------------------------

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

        // Look. Think. Join the dark side.
        var shown = null;
        var saved = null
        this.show = function (show) {
                saved = shown
                shown = updateChild( this.pane, show, shown )
        }
        this.onclick = function() {
                this.show(saved)
        }
}

function updateChild(par, n, o) {
        if( n && o ) par.replaceChild(n, o) ;
        else if (n) par.appendChild(n);
        else if (o) par.removeChild(o);
        return n
}

// Command line widget -------------------------------------------

// Runs the string "text", returns an DIV (pane) to catch the results. 
function runCommand( session, text, gotit ) {

        function show_result(resp) {
                var pane = new Pane(session, text);
                pane.show( resp )
                session.container.insertBefore(pane.pane, session.commander);
                if(gotit) 
                        gotit(resp); 
        }

        var words = text.replace('/\s+/g', ' ').split(' ');
        if (!words) 
                show_result();
        else if ( resp = builtinCommand(session, words, text) ) 
                show_result(resp);
        else 
                requestURI( words[0], show_result );

        ++session.command_id;
}

function suggestionBox(session, prefix) {
        slist = suggestionList(session, prefix).join(' ');
        if(!slist) 
                return
        var sbox = document.createElement('div')
        sbox.style.height = '100px';
        sbox.style.width  = '100%';
        sbox.style.backgroundColor  = 'red';
        sbox.innerHTML = suggestionList(session, prefix).join(' ');
        return sbox
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

        var sbox = null
        function sugg(box) {
                if(sbox) {
                        if(box)
                                session.commander.replaceChild(box, sbox);
                        else
                                session.commander.removeChild(sbox);
                } else if (box)
                        session.commander.appendChild(box);
                sbox = box;
        }

        function enter(ev) { // Handle user hitting ENTER
                var old_prompt = prompt;
                prompt = createPrompt(session);
                prspan.replaceChild( prompt, old_prompt );

                // FIX: Naming
                runCommand(session, input.value, function(){
                        input.focus();
                        window.scrollTo(0, session.commander.offsetTop);
                })
        }

        input.onkeyup = function(ev) { // Filter user keystrokes
                var prefix = input.value.slice(0, input.selectionStart)
                if(input.value) {
                        sugg( suggestionBox(session, prefix) );
                        window.scrollTo(0, session.commander.offsetTop);
                }
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

