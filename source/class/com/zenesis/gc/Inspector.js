qx.Class.define("com.zenesis.gc.Inspector", {
	extend: qx.core.Object,
	implement: [ com.zenesis.gc.IInspector ],
	
	members: {
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcIterate
		 */
		gcIterate: function(obj, mark, context) {
			var properties = com.zenesis.gc.Inspector.getProperties(obj.constructor);
			for (var name in properties) {
				var prop = properties[name];
				var value = prop.get.call(obj);
				if (value)
					mark.call(context, value);
			}
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcCreate
		 */
		gcCreate: function(value) {
		},
		
		/*
		 * @Override com.zenesis.gc.Inspector.gcDispose
		 */
		gcDispose: function(value) {
		}
	},
	
	statics: {
		getProperties: function(clz) {
			if (clz.hasOwnProperty("$$gc_properties"))
				return clz.$$gc_properties;
			
			var properties = {};
			for (var tmp = clz.prototype; tmp; tmp = tmp.superclass) {
				if (tmp.hasOwnProperty("$$gc_properties")) {
					properties = qx.lang.Object.clone(tmp.$$gc_properties);
					break;
				}
			}
			
			var names = qx.Class.getProperties(clz);
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				var def = qx.Class.getPropertyDefinition(clz, name);
				
				// If there is a "check" then try to exclude the property from checks
				if (def.check) {
					// Some checks imply there is no ref counting to be done
					if (com.zenesis.gc.Inspector.__IGNORE_CHECKS[def.check])
						continue;
				}
				
				// Add the property
				properties[name] = {
					get: clz.prototype["get" + qx.lang.String.firstUp(name)]	
				};
			}
			
			return clz.$$gc_properties = properties;
		},
		
		/** 
		 * Values which can appear in a property definition's "check" that mean we cannot do garbage
		 * collection.
		 */
		__IGNORE_CHECKS: {
		      "Boolean"   : true,
		      "String"    : true,

		      "Number"    : true,
		      "Integer"   : true,
		      "PositiveNumber" : true,
		      "PositiveInteger" : true,

		      "Error"     : true,
		      "RegExp"    : true,

		      "Function"  : true,
		      "Date"      : true,
		      "Node"      : true,
		      "Element"   : true,
		      "Document"  : true,
		      "Window"    : true,
		      "Event"     : true,

		      "Class"     : true,
		      "Mixin"     : true,
		      "Interface" : true,
		      "Theme"     : true,

		      "Color"     : true,
		      "Decorator" : true,
		      "Font"      : true
		}
	}
});