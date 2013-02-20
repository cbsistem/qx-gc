qx.Class.define("com.zenesis.gc.test.DemoRefArray", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.ICollectable ],
	
	construct: function(obj, name) {
		this.base(arguments);
		if (obj) {
			if (obj instanceof qx.data.Array)
				this.setArr(obj);
			else if (qx.lang.Type.isArray(obj))
				this.setArr(new qx.data.Array(obj));
			else
				this.setArr(new qx.data.Array([obj]));
		}
		if (name)
			this.$$name = name;
	},
	
	properties: {
		arr: {
			init: null,
			nullable: true,
			check: "qx.data.Array"
		}
	}
});