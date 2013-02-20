qx-gc - Contrib for Qooxdoo (http://qooxdoo.org)
================================================

When Qooxdoo objects are no longer needed it is typically necessary to call dispose() on
unwanted object to release resources; not tracking objects and dispose()ing of them can 
lead to memory and other resource leaks.

Keeping track of what's in use manually can lead to memory leaks and other bugs which can
be time consuming and difficult to track down - plus of course you've got to write and test
the code to manage all those objects in the first place.

Garbage collection is neat and simple concept where the language silently takes care of 
cleaning up unused objects for you; unfortunately in Javascript when the memory used by an
object is freed up there is no opportunity to execute code (IE objects do not have a 
destructor).

This qx-gc contrib automatically tracks references to Qooxdoo objects so that they can be
properly (and automatically) dispose()d when they are no longer in use.  

