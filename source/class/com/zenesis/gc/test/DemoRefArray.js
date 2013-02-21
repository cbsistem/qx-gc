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