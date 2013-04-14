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

How does it work?
-----------------
Qx-GC doesn't have a magic connection inside the Javascript VM, it only works by being able
to detect what objects are referred to - and it cannot see references made by ordinary "var"
declarations or class members, but it can see objects referred to from normal Qooxdoo property 
declarations.  

In practice, this is adequate for many situations, but where a class refers to objects in other 
ways (eg a class' member variable) it's easy to write a custom "inspector" which can look inside
the objects detect those references.  Qx-GC includes an inspector for qx.data.Array.

Qx-GC only works on classes that it knows that it can detect references from; this makes it safe 
to use, without having to make sure that other libraries (or even *all* of your classes) support 
Qx-GC.


How do I use it?
----------------
In order to detect unused objects, Qx-GC needs to know two things: a list of all objects which 
can be Garbage Collected, and the root(s) of the tree of object references (IE where objects
refer to other objects, the root object is the top of the tree and is not referred to by anything
else).

Any class that you want to be Garbage Collected (IE automatically dispose()'d when no longer
used) must either implement com.zenesis.gc.ICollectable interface, or be registered with Qx-GC
by calling:

	com.zenesis.gc.GC.getInstance().registerCollectable(clazz)

where clazz is the class or interface that you want monitored.

When Qx-GC collects garbage, it starts from of the root objects and checks every reference 
recursively; when complete, any Collectable object which is not referred to is dispose()'d.

To specify root objects, either call:

	com.zenesis.gc.GC.getInstance().addRoot(myRootObject);
	
or use an instance of com.zenesis.gc.Ref.  In many cases, there will only be a few roots in your
application, and the easiest way to manage these is to use com.zenesis.gc.Ref.  EG:

qx.Class.define("myapp.MyClass", {
	construct: function(someCollectableObject) {
		this.base(arguments);
		this.__ref = new com.zenesis.gc.Ref(someCollectableObject);
	},
	members: {
		__ref: null,
		myMethod: function() {
			this.__ref.someMethod();
		}
	}
});


Writing custom inspectors
-------------------------

For each class that you want to be automatically tracked, you must call 
	com.zenesis.gc.GC.getInstance().registerInspector(clazz,inpector)
where clazz is the class or interface you want to track instances of, and inspector is an
instance of com.zenesis.gc.IInspector that is able to look inside instances of the class to 
detect references to other objects.

Where you have a hierachy of derived classes, it is not necessary to specify every class - if you 
specify an inspector for a class, then all instance of that class and all derived classes are 
tracked.

You can also specify that a class implements com.zenesis.gc.ICollectable; there are no methods to
implement, it's just a marker interface that means that the object can be inspected to find 
properties which refer to other objects.


Specifying Roots
----------------
The list of roots must be provided manually, and this can be done by either calling
com.zenesis.gc.GC.getInstance().addRoot(root) and passing the root, or by using an instance of
com.zenesis.gc.GC.Ref which will include your object within its own root.
