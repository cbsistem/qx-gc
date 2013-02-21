/* ************************************************************************

   qx-gc - a contrib to the Qooxdoo project (http://qooxdoo.org/)

   http://qooxdoo.org

   Copyright:
     2012 Zenesis Limited, http://www.zenesis.com

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     
     This software is provided under the same licensing terms as Qooxdoo,
     please see the LICENSE file in the Qooxdoo project's top-level directory 
     for details.

   Authors:
     * John Spackman (john.spackman@zenesis.com)

************************************************************************ */

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
