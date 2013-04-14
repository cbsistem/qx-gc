/* ************************************************************************

   GC - a contrib to the Qooxdoo project (http://qooxdoo.org/)

   http://qooxdoo.org

   Copyright:
     2012-2013 Zenesis Limited, http://www.zenesis.com

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     
     This software is provided under the same licensing terms as Qooxdoo,
     please see the LICENSE file in the Qooxdoo project's top-level directory 
     for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com)

************************************************************************ */

/**
 * Implements Generational Garbage Collection for registered objects and the
 * objects that they reference via properties and that can be discovered
 * by IInspector and Inspector instances.
 * 
 * GC works by detecting when objects are "unreachable" and then
 * releasing the memory used by that object; an object is unreachable when
 * either there are no references to that object directly, or the only objects
 * which do refer to it are themselves unreachable.  
 * 
 * To detect unreachable objects, the GC starts with several "root" objects 
 * which it examines to find what objects they reference; it then examines those
 * referenced objects to find more referenced objects.  This process continues
 * until it has examined every reference, and any objects not found are then
 * disposed of.
 * 
 * A disadvantage of garbage collection in general is that with a large number 
 * of objects to scan, examining all the objects in turn can be slow; to
 * reduce the time taken, Generational Garbage Collection divides the objects
 * into groups ("generations") where lower (younger) generations are a subset 
 * which require scanning more often.  This works because most objects are short 
 * lived and the older the object the less likely it is to be disposed of.
 * 
 * The GC depends on two essential pieces of information: (1) a list of
 * root objects, and (2) it must be able to tell when an object in a higher
 * (older) generation gets a reference to a lower (younger) generation.
 * 
 * To add root objects, call GC.addRoot() - you can add as many as you like,
 * and a good example would be the Application instance of your Qooxdoo
 * program.
 * 
 * Detecting references between objects is done automatically wherever possible,
 * primarily by inspecting properties on an object and watching them for changes;
 * GC will also watch the contents qx.data.Array.
 * 
 * 
 * 
 */
qx.Class.define("com.zenesis.gc.GC", {
	extend: qx.core.Object,
	type: "singleton",
	
	construct: function() {
		this.base(arguments);
		this.registerCollectable(com.zenesis.gc.ICollectable);
		this.registerInspector(com.zenesis.gc.ICollectable, new com.zenesis.gc.Inspector());
		this.registerCollectable(qx.data.Array);
		this.registerInspector(qx.data.Array, new com.zenesis.gc.ArrayInspector());
	},
	
	members: {
		// Root objects
		__roots: {},
		
		// Generation object pools
		__gen: [{}, {}],
		
		// Whether dirty references are detected by mark()
		__hasDirtyRef: false,
		
		// Size of gen0 at last collection
		__gen0LastSize: 0,
		
		// Whether currently promoting gen0 objects
		__gen0Promote: false,
		
		// Whether to scan all generations
		__scanAllGenerations: false,
		
		// Statistics
		__stats: {
			generations: [ 
			    { count: 0 }, { count: 0 } 
			],
			timing: {
				full: {
					count: 0, maxMark: 0, totalMark: 0, lastMark: 0, maxSweep: 0, totalSweep: 0, lastSweep: 0, totalNumDisposed: 0, lastNumDisposed: 0
				},
				normal: {
					count: 0, maxMark: 0, totalMark: 0, lastMark: 0, maxSweep: 0, totalSweep: 0, lastSweep: 0, totalNumDisposed: 0, lastNumDisposed: 0
				}
			}
		},
		
		/**
		 * Adds a root
		 * @param obj
		 */
		addRoot: function(obj) {
			this.registerObject(obj);
			var hash = obj.toHashCode();
			obj.$$gc.isRoot = true;
			this.__roots[hash] = obj;
		},
		
		/**
		 * Registers an object to be tracked
		 * @param obj {Object}
		 */
		registerObject: function(obj) {
			if (obj.$$gc !== undefined)
				return;
			
			var hash = obj.toHashCode();
			obj.$$gc = {
				genIndex: 0
			};
			this.__gen[0][hash] = obj;
		},
		
		/**
		 * Deregisters an object
		 * @param obj
		 */
		deregisterObject: function(obj) {
			if (obj.$$gc === undefined)
				return;
			var hash = obj.toHashCode();
			delete this.__gen[obj.$$gc.genIndex][hash];
			obj.$$gc = undefined;
		},
		
		/**
		 * Adds an inspector for a particular class
		 * @param clz
		 * @param inspector
		 */
		registerInspector: function(clz, inspector) {
			if (qx.core.Environment.get("qx.debug")) {
				qx.core.Assert.assertFalse(clz.hasOwnProperty("$$gc_inspector"));
			}
			clz.$$gc_inspector = inspector;
		},
		
		/**
		 * Registers a class that can be collected by the GC 
		 * @param clz
		 */
		registerCollectable: function(clz) {
			clz.$$gc_collectable = true;
		},
		
		/**
		 * Performs garbage collection
		 * @param type {String} "full" to do full GC, "promote" to promote surviving 
		 * 	generation 0 objects to generation 1; default is to collect gen0 only and to
		 * 	promote to generation 1 only if generation 0 is over threshold
		 */
		collect: function(type) {
			var timeStart = new Date();
			
			var gen0 = this.__gen[0];
			var gen1 = this.__gen[1];
			
			// Full collection - move everything back into gen0 and (re)promote if necessary
			if (type === "full") {
				for (var hash in gen1) {
					var obj = gen1[hash];
					var $$gc = obj.$$gc;
					$$gc.dirty = false;
					$$gc.genIndex = 0;
					gen0[hash] = obj;
				}
				this.__gen[1] = gen1 = [];
			}
			
			// Whether to promote gen0 items
			if (type === "promote") {
				this.__gen0Promote = true;
			} else {
				var gen0length = gen0.length;
				var gen1length = gen1.length;
				this.__gen0Promote = gen0length > com.zenesis.gc.GC.GEN0_MIN_PROMOTION &&
					(gen0length / (gen0length + gen1length)) >= com.zenesis.gc.GC.GEN0_TARGET_PERCENT;
			}
			
			// Scan all the roots
			var roots = this.__roots;
			for (var hash in roots) {
				this.mark(roots[hash]);
			}
			
			// Now check any dirty gen1 references
			var gen1 = this.__gen[1];
			for (var hash in gen1) {
				var obj = gen1[hash];
				if (obj.$$gc.dirty || obj.isDisposed()) {
					this.__hasDirtyRef = false;
					this.mark(obj);
					obj.$$gc.dirty = this.__hasDirtyRef;
				}
			}
			
			var timeMark = new Date();

			// Cleanup
			var numDisposed = this.sweep();
			
			var timeSweep = new Date();
			var msMark = timeMark - timeStart;
			var msSweep = timeSweep - timeMark;
			var stat = (type === "full") ? this.__stats.timing.full : this.__stats.timing.normal;
			stat.count++;
			stat.maxMark = Math.max(stat.maxMark, msMark);
			stat.totalMark += msMark;
			stat.maxSweep = Math.max(stat.maxSweep, msSweep);
			stat.totalSweep += msSweep;
			stat.lastMark = msMark;
			stat.lastSweep = msSweep;
			stat.lastNumDisposed = numDisposed;
			stat.totalNumDisposed += numDisposed;
			this.__stats.generations[0].count = Object.keys(gen0).length;
			this.__stats.generations[1].count = Object.keys(gen1).length;
		},
		
		/**
		 * Marks an object as having a reference
		 * @param obj
		 * @param parent
		 */
		mark: function(obj, parent) {
			if (obj === null || obj === undefined)
				return;
			
			// Arrays
			if (!(obj instanceof qx.core.Object) && qx.lang.Type.isArray(obj)) {
				for (var i = 0; i < obj.length; i++) {
					this.mark(obj[i]);
				}
				return;
			}
			
			// If it's not a tracked object, then all we can do is iterate it blindly
			if (obj.$$gc === undefined) {
				if (obj.constructor.$$gc_inspector !== undefined) {
					obj.constructor.$$gc_inspector.gcIterate(obj, this.mark, this);
				}
				return;
			}
			
			// Preserve dirty reference so that it only tracks one level down
			var hasDirtyRef = this.__hasDirtyRef;
			
			// Already marked?  nothing to do
			if (obj.$$gc.marked) {
				return;
			}
			
			// Mark in use, unless it's already disposed in which case it shouldn't be here
			if (!obj.isDisposed()) {
				obj.$$gc.marked = true;
			}
			
			// Gen0 objects mark owning gen1 objects as dirty
			if (obj.$$gc.genIndex == 0) {
				hasDirtyRef = true;
			}
			
			// If it's gen0;
			//	if it's dirty (ie it's gen1 and has direct references to gen0);
			//	if it's disposed (and shouldn't be here);
			if (obj.$$gc.isRoot === true || obj.$$gc.genIndex === 0 || obj.$$gc.dirty || obj.isDisposed()) {
				if (obj.constructor.$$gc_inspector !== undefined) {
					this.__hasDirtyRef = false;
					obj.constructor.$$gc_inspector.gcIterate(obj, this.mark, this);
					obj.$$gc.dirty = this.__hasDirtyRef;
				}
			}
			
			// Keep hasDirtyRef as only one level deep
			this.__hasDirtyRef = hasDirtyRef;
		},
		
		/**
		 * Disposes of objects not reachable
		 */
		sweep: function() {
			var lastGen = null;
			var numDisposed = 0;
			for (var genIndex = this.__gen.length - 1; genIndex >= 0; genIndex--) {
				var gen = this.__gen[genIndex];
				for (var hash in gen) {
					var obj = gen[hash];
					
					// No longer needed? dispose of it
					if (!obj.$$gc.marked) {
						obj.$$gc = undefined;
						delete gen[hash];
						if (!obj.isDisposed())
							obj.dispose();
						numDisposed++;
						
					// Still referenced
					} else {
						// Clear the mark ready for next time
						obj.$$gc.marked = false;
						
						// Promote survivors up a generation
						if (genIndex == 0 && this.__gen0Promote) {
							obj.$$gc.genIndex = genIndex + 1;
							delete gen[hash];
							lastGen[hash] = obj;
						}
					}
				}
				lastGen = gen;
			}
			return numDisposed;
		},
		
		/**
		 * Returns statistics
		 * @returns
		 */
		getStats: function() {
			return qx.lang.Object.clone(this.__stats, true);
		}
	},
	
	statics: {

		/**
		 * The target size of generation0 as a percentage of the total number of tracked objects,
		 * ie 0.20 is to keep generation 0 at or below 20% of the total; when this percentage is
		 * reached, generation0 objects will be promoted to generation1 (provided that
		 * GEN0_COLLECTION_MINIMUM has been reached)
		 */
    	 GEN0_TARGET_PERCENT: 0.20,
    	 
    	 /**
    	  * The minimum size of generation0 before promotion to generation1 is allowed; this keeps
    	  * generation0 from emptying out too fast
    	  */
    	 GEN0_MIN_PROMOTION: 1000,
    	 
    	 /**
    	  * Records a reference from a parent object to a child; this is necessary to maintain
    	  * 'dirty' flags on generation1 objects
    	  * @param parent
    	  * @param child
    	  */
    	 addReference: function(parent, child) {
    		 if (parent.$$gc == undefined)
    			 return;
    		 
    		 if (child !== undefined && child !== null && child.$$gc !== undefined) {
				// if parent is referring to a different generation, then it needs to be checked
				if (parent.$$gc.genIndex != child.$$gc.genIndex)
					parent.$$gc.dirty = true;
    		 }
    	 },
    	 
    	 /**
    	  * Records the removal of a reference from a parent object to a child; this is necessary 
    	  * to maintain 'dirty' flags on generation1 objects
    	  * @param parent
    	  * @param child
    	  */
    	 removeReference: function(parent, child) {
    		 if (parent.$$gc === undefined)
    			 return;
    		 
    		 if (child !== undefined && child !== null && child.$$gc !== undefined) {
				// If the old value is not in gen0, then it needs to be checked for disposal 
				if (child.$$gc.genIndex != 0)
					child.$$gc.dirty = true;
			}
    	 },
		
	    /**
	     * This function will be called before each property set
	     *
	     * @param fullName {String} Full name of the function including the class name.
	     * @param fcn {Function} Function to set property
	     * @param type {String} Function type as in parameter with same name to
	     *                      {@link qx.core.Aspect#addAdvice}
	     * @param args {arguments} The arguments passed to the wrapped function
	     */
		__beforePropSet: function(fullName, fcn, type, args) {
			if (this.$$gc === undefined)
				return;
			
			var pos = fullName.lastIndexOf('.');
			var name = qx.lang.String.firstLow(fullName.substring(pos + 1));
			var oldValue = this.constructor.$$gc_inspector.gcGetPropertyValue(name);
			var value = args[0];
			
			// No change?
			if (value === oldValue)
				return;
			
			com.zenesis.gc.GC.addReference(this, value);
			com.zenesis.gc.GC.removeReference(this, oldValue);
		},
		
		/**
		 * Called after creating an object
		 * @param fullName
		 * @param fcn
		 * @param type
		 * @param args
		 */
		__afterConstructor: function(fullName, fcn, type, args) {
			if (com.zenesis.gc.GC.isCollectable(this.constructor)) {
				com.zenesis.gc.GC.getInstance().registerObject(this);
			}
			if (this.constructor.$$gc_inspector) {
				this.constructor.$$gc_inspector.gcCreate(this);
			}
			return this;
		},
		
		/**
		 * Called before destroying an object
		 */
		__beforeDestructor: function() {
			if (this.constructor.$$gc_inspector) {
				this.constructor.$$gc_inspector.gcDispose(this);
			}
			return this;
		},

		/**
		 * Called before members
		 * @param fullName
		 * @param fcn
		 * @param type
		 * @param args
		 */
		__beforeMemberCall: function(fullName, fcn, type, args) {
			if (this.classname) {
				if (this.isDisposed()) {
					this.warn("Method call on disposed object " + fullName + ": " + this);
				}
			}
		},
		
		/**
		 * Detects whether a class is collectable by the GC 
		 * @param clz
		 * @returns
		 */
		isCollectable: function(clz) {
			this.__initClass(clz);
			return clz.$$gc_collectable;
		},
		
		/**
		 * Initialises class definitions with GC data
		 * @param clz
		 */
		__initClass: function(clz) {
			if (clz.$$gcInit === undefined) {
				clz.$$gcInit = true;
				var collectable = undefined;
				var inspector = undefined;
				for (var tmp = clz; tmp && collectable === undefined && inspector === undefined; tmp = tmp.superclass) {
					if (collectable === undefined) {
						collectable = tmp.$$gc_collectable;
					}
					if (inspector === undefined) {
						inspector = tmp.$$gc_inspector;
					}
					for (var lst = qx.Class.getInterfaces(tmp), i = 0; i < lst.length && collectable === undefined && inspector === undefined; i++) {
						if (collectable === undefined) {
							collectable = lst[i].$$gc_collectable;
						}
						if (inspector === undefined) {
							inspector = lst[i].$$gc_inspector;
						}
					}
				}
				clz.$$gc_collectable = collectable = !!collectable;
				clz.$$gc_inspector = inspector;
			}
		}

	},
	
	defer: function(statics) {
		if (qx.core.Environment.get("qx.aspects")) { 
			if (qx.core.Environment.get("com.zenesis.gc.GC.enableAutoCollect")) {
				qx.core.Aspect.addAdvice(statics.__afterConstructor, "after", "constructor");
				qx.core.Aspect.addAdvice(statics.__beforeDestructor, "before", "destructor");
				qx.core.Aspect.addAdvice(statics.__beforePropSet, "before", "property", /\.set[A-Z][a-zA-Z0-9_]+$/);
			}
		}
	}
});