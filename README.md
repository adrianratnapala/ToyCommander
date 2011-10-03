ToyCommander
------------
    
This is a client-side tool for providing command-line interfaces over the web.
Think of a web-enabled Mathematica notebook or interpreter shell as the kind of
application this might be good for.  Because it's on the web, your applications
can 

* use text, graphics, hyperlinks and whatever,

* interact with the user even in where you have already produced output,

* supply interactive help and hints to users, _before_ they enter their commands.


But it still features old-school command line goodies like:

* Pure textual commands for easy batching / scripting.

* Users can easily scroll back to see their previous work.

* Searchable history.

* Command line completion.

ToyCommander is just a little bit of Javascript that provides a User Interface.
For testing, it just accesses some static local data files.  To anything do
interesting, you will need to provide an interesting server.  So go make some
toys!

