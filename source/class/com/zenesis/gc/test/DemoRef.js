qx.Class.define("com.zenesis.gc.test.DemoRef", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.ICollectable ],
	
	construct: function(ref, name) {
		this.base(arguments);
		if (ref)
			this.setRef(ref);
		if (name)
			this.$$name = name;
	},
	
	properties: {
		ref: {
			init: null,
			nullable: true
		}
	}
});