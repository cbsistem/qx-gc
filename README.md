qx-gc - Contrib for Qooxdoo (http://qooxdoo.org)
================================================

When Qooxdoo objects are no longer needed it is typically necessary to call dispose() on
unwanted objects to release their resources; not tracking objects and dispose()ing of them 
can lead to memory and other resource leaks.  The Qx-GC contrib automatically tracks 
references to objects and dispose()'s of them when they are no longer needed, simplifying
code and reducing the amount of testing and debugging work needed to be done.

As important as it is to keep track of what's in use (and what's not) doesn't make it 
easy to do; in fact, for anything but the most straightforward of applications, keeping
track of resources can become a challenge, and like all challenges need testing and 
debugging.

Garbage collection is a neat and simple concept where the language silently takes care of 
cleaning up unused objects for you; in Javascript this is automatic and is built in to 
the language, but this only works if you don't care when an object is no longer needed.
Like many frameworks, Qooxdoo _does_ care and every object must have it's dispose() method
called when the object is no longer needed.

Weak References
---------------
Languages with built-in garbage collectors often include Weak References, IE a reference
to an object which becomes null when nothing else refers to the object; this is most often
used for caching mechanisms, where something is kept around (in the cache) only while other
code needs it.  Javascript does not support this - but Qx-GC does with the com.zenesis.gc.WeakRef
class.

Documentation
-------------
Please see the Qooxdoo contrib site for documentation:

	http://qooxdoo.org/contrib/project/qx-gc
	
	
