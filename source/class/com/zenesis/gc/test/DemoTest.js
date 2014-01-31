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

qx.Class.define("com.zenesis.gc.test.DemoTest", {
  extend : qx.dev.unit.TestCase,

  members : {
    /**
     * Allocates some objects and checks they're disposed correctly
     */
    testSimple1 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var dr1, dra1, dr2, dr3;

      dr1 = new com.zenesis.gc.test.DemoRef();
      dra1 = new com.zenesis.gc.test.DemoRefArray();
      dr2 = new com.zenesis.gc.test.DemoRef(dra1);
      dr3 = new com.zenesis.gc.test.DemoRef(dr2);
      GC.collect();
      qx.core.Assert.assertTrue(dr1.isDisposed());
      qx.core.Assert.assertTrue(dra1.isDisposed());
      qx.core.Assert.assertTrue(dr2.isDisposed());
      qx.core.Assert.assertTrue(dr3.isDisposed());
    },

    /**
     * Allocates some objects, keeps a reference to one, and checks only the
     * correct ones are disposed
     */
    testSimple2 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var dr1, dra1, dr2, dr3;

      dr1 = new com.zenesis.gc.test.DemoRef();
      dra1 = new com.zenesis.gc.test.DemoRefArray();
      dr2 = new com.zenesis.gc.test.DemoRef(dra1);
      dr3 = new com.zenesis.gc.test.DemoRef(dr2);
      var ref = new com.zenesis.gc.Ref(dr3);
      GC.collect();
      qx.core.Assert.assertTrue(dr1.isDisposed());
      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(!dr3.isDisposed());
      ref.setRef(null);
      GC.collect();
      qx.core.Assert.assertTrue(dra1.isDisposed());
      qx.core.Assert.assertTrue(dr2.isDisposed());
      qx.core.Assert.assertTrue(dr3.isDisposed());
    },

    /**
     * Allocates some objects, gets them promoted to gen1, and checks gen0
     * objects are only disposed of when there are no more references
     */
    testPromotion1 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var dr1, dra1, dr2, dr3;

      dr1 = new com.zenesis.gc.test.DemoRef();
      dr1.$$id = "dr1";
      var ref = new com.zenesis.gc.Ref(dr1);
      GC.collect("promote");
      qx.core.Assert.assertTrue(!dr1.isDisposed());
      qx.core.Assert.assertTrue(dr1.$$gc.genIndex === 1);
      qx.core.Assert.assertTrue(ref.$$gc.genIndex === 1);

      // Circular ref dr2 <> dr3
      dr2 = new com.zenesis.gc.test.DemoRef();
      dr3 = new com.zenesis.gc.test.DemoRef(dr2);
      dr2.setRef(dr3);

      // dra1 contains dr2 and dr3
      dra1 = new com.zenesis.gc.test.DemoRefArray(new qx.data.Array());
      dra1.getArr().push(dr2);
      dra1.getArr().push(dr3);

      // Hook dra1[gen#0] <- dr1[gen#1] <- ref[gen#1]
      dr1.setRef(dra1);

      // Collect - nothing should be disposed yet
      GC.collect();
      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(dra1.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(dr2.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(!dr3.isDisposed());
      qx.core.Assert.assertTrue(dr3.$$gc.genIndex === 0);

      // Unhook ref[#1]; dr1 is also gen1 so ref is not dirty
      ref.setRef(null);
      dr1.$$id = "dr1";
      GC.collect();

      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(!dr1.isDisposed());
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(!dr3.isDisposed());

      // Full
      GC.collect("full");
      qx.core.Assert.assertTrue(dra1.isDisposed());
      qx.core.Assert.assertTrue(dr1.isDisposed());
      qx.core.Assert.assertTrue(dr2.isDisposed());
      qx.core.Assert.assertTrue(dr3.isDisposed());
    },

    testGen1 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var dr1, dra1, dr2, dr3;

      dr1 = new com.zenesis.gc.test.DemoRef(null, "dr1");
      var ref = new com.zenesis.gc.Ref(dr1);

      // Circular ref dr2 <> dr3, dra1 contains dr2 and dr3
      dra1 = new com.zenesis.gc.test.DemoRefArray(new qx.data.Array(), "dra1");
      dr2 = new com.zenesis.gc.test.DemoRef(null, "dr2");
      dr3 = new com.zenesis.gc.test.DemoRef(dr2, "dr3");
      dr2.setRef(dr3);
      dra1.getArr().push(dr2);
      dra1.getArr().push(dr3);

      // Hook dra1 <- dr1 <- ref
      dr1.setRef(dra1);

      qx.core.Assert.assertTrue(!dr1.isDisposed());
      qx.core.Assert.assertTrue(dr1.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(ref.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(dra1.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(dr2.$$gc.genIndex === 0);
      qx.core.Assert.assertTrue(!dr3.isDisposed());
      qx.core.Assert.assertTrue(dr3.$$gc.genIndex === 0);

      // Collect - nothing should be disposed yet
      GC.collect("promote");
      qx.core.Assert.assertTrue(!dr1.isDisposed());
      qx.core.Assert.assertTrue(dr1.$$gc.genIndex === 1);
      qx.core.Assert.assertTrue(ref.$$gc.genIndex === 1);
      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(dra1.$$gc.genIndex === 1);
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(dr2.$$gc.genIndex === 1);
      qx.core.Assert.assertTrue(!dr3.isDisposed());
      qx.core.Assert.assertTrue(dr3.$$gc.genIndex === 1);

      // Unhook ref[#1]; dr1 is also gen1 so ref is not dirty
      ref.setRef(null);

      GC.collect();
      qx.core.Assert.assertTrue(!dra1.isDisposed());
      qx.core.Assert.assertTrue(!dr1.isDisposed());
      qx.core.Assert.assertTrue(!dr2.isDisposed());
      qx.core.Assert.assertTrue(!dr3.isDisposed());

      GC.collect("full");
      qx.core.Assert.assertTrue(dra1.isDisposed());
      qx.core.Assert.assertTrue(dr1.isDisposed());
      qx.core.Assert.assertTrue(dr2.isDisposed());
      qx.core.Assert.assertTrue(dr3.isDisposed());
    },

    testCrossGenChains : function() {
      // Test:
      // dr1[#0] -> dr2[#0] -> dr3[#1] -> #dr4[#1]
      // dr1[#1] -> dr2[#1] -> dr3[#0] -> #dr4[#0]
      // dr1[#0] -> dr2[#1] -> dr3[#0] -> #dr4[#1] -> dr1[#0]
    },

    testLarge1 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var arr = new qx.data.Array();

      var rootArray = new qx.data.Array();
      var root = new com.zenesis.gc.Ref(rootArray);
      var allRefs = [];

      for ( var i = 0; i < 100; i++) {
        var arr1 = new qx.data.Array();
        var dr1 = new com.zenesis.gc.test.DemoRef(arr1);
        rootArray.push(dr1);
        allRefs.push(dr1);

        for ( var j = 0; j < 100; j++) {
          var dr2 = new com.zenesis.gc.test.DemoRef();
          arr1.push(dr2);
          allRefs.push(dr2);
        }
      }

      GC.collect();
      for ( var i = 0; i < allRefs.length; i++)
        qx.core.Assert.assertTrue(!allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));

      GC.collect("full");
      for ( var i = 0; i < allRefs.length; i++)
        qx.core.Assert.assertTrue(!allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));

      root.setRef(null);

      GC.collect("full");
      for ( var i = 0; i < allRefs.length; i++)
        qx.core.Assert.assertTrue(allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));
    },

    testLarge2 : function() {
      var GC = com.zenesis.gc.GC.getInstance();
      var rootArray = new qx.data.Array();
      var root = new com.zenesis.gc.Ref(rootArray);

      for ( var i = 0; i < 10000; i++) {
        var dr1 = new com.zenesis.gc.test.DemoRef();
        rootArray.push(dr1);
      }

      GC.collect();
      for ( var i = 0; i < rootArray.getLength(); i++)
        qx.core.Assert.assertTrue(!rootArray.getItem(i).isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));

      var allRefs = rootArray.toArray().slice(0);

      for ( var i = 0; i < rootArray.getLength(); i += 3)
        rootArray.setItem(i, null);
      GC.collect("full");
      for ( var i = 0; i < rootArray.getLength(); i += 3)
        qx.core.Assert.assertTrue(allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));

      for ( var i = 1; i < rootArray.getLength(); i += 3)
        rootArray.setItem(i, null);
      GC.collect("full");
      for ( var i = 1; i < rootArray.getLength(); i += 3)
        qx.core.Assert.assertTrue(allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));

      for ( var i = 2; i < rootArray.getLength(); i += 3)
        rootArray.setItem(i, null);
      GC.collect("full");
      for ( var i = 0; i < rootArray.getLength(); i++)
        qx.core.Assert.assertTrue(allRefs[i].isDisposed());
      this.debug("stats: " + qx.lang.Json.stringify(GC.getStats(), null, 2));
    }
  }
});
