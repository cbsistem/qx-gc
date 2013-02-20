qx.Class.define("com.zenesis.gc.Ref", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.ICollectable ],
	
	construct: function(ref) {
		this.base(arguments);
		if (!com.zenesis.gc.Ref.__allRefs) {
			var allRefs = com.zenesis.gc.Ref.__allRefs = new qx.data.Array();
			com.zenesis.gc.GC.getInstance().addRoot(allRefs);
		}
		com.zenesis.gc.Ref.__allRefs.push(this);
		if (ref)
			this.setRef(ref);
	},
	
	destruct: function() {
		com.zenesis.gc.Ref.__allRefs.remove(this);
	},
	
	properties: {
		ref: {
			init: null,
			nullable: true,
			check: "qx.core.Object",
			event: "changeRef"
		}
	},
	
	statics: {
		__allRefs: null
	}
});
