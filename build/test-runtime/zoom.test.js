"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var util_1 = require("./util");
var hits = {
    zoom: [9, 23],
    bins: [8, 2]
};
function zoom(key, idx, zoom, parent, targetBrush) {
    var delta = zoom === 'out' ? 200 : -200;
    return "return zoom(" + hits[key][idx] + ", " + delta + ", " + parent + ", " + targetBrush + ")";
}
var cmp = function (a, b) { return a - b; };
[util_1.bound, util_1.unbound].forEach(function (bind) {
    describe("Zoom " + bind + " interval selections at runtime", function () {
        var type = 'interval';
        var embed = util_1.embedFn(browser);
        var testRender = util_1.testRenderFn(browser, "interval/zoom/" + bind);
        var binding = bind === util_1.bound ? { bind: 'scales' } : {};
        var assertExtent = {
            in: ['isAtLeast', 'isAtMost'], out: ['isAtMost', 'isAtLeast']
        };
        function setup(brushKey, idx, encodings, parent) {
            var inOut = idx % 2 ? 'out' : 'in';
            var xold;
            var yold;
            if (bind === util_1.unbound) {
                var drag = browser.execute(util_1.brush(brushKey, idx, parent)).value[0];
                xold = drag.intervals[0].extent.sort(cmp);
                yold = encodings.indexOf('y') >= 0 ? drag.intervals[encodings.indexOf('x') + 1].extent.sort(cmp) : null;
            }
            else {
                xold = JSON.parse(browser.execute('return JSON.stringify(view._runtime.scales.x.value.domain())').value);
                yold = browser.execute('return view._runtime.scales.y.value.domain()').value;
            }
            return { inOut: inOut, xold: xold, yold: yold };
        }
        it('should zoom in and out', function () {
            for (var i = 0; i < hits.zoom.length; i++) {
                embed(util_1.spec('unit', i, tslib_1.__assign({ type: type }, binding)));
                var _a = setup('drag', i, ['x', 'y']), inOut = _a.inOut, xold = _a.xold, yold = _a.yold;
                testRender(inOut + "-0");
                var zoomed = browser.execute(zoom('zoom', i, inOut, null, bind === util_1.unbound)).value[0];
                var xnew = zoomed.intervals[0].extent.sort(cmp);
                var ynew = zoomed.intervals[1].extent.sort(cmp);
                testRender(inOut + "-1");
                chai_1.assert[assertExtent[inOut][0]](xnew[0], xold[0]);
                chai_1.assert[assertExtent[inOut][1]](xnew[1], xold[1]);
                chai_1.assert[assertExtent[inOut][0]](ynew[0], yold[0]);
                chai_1.assert[assertExtent[inOut][1]](ynew[1], yold[1]);
            }
        });
        it('should work with binned domains', function () {
            for (var i = 0; i < hits.bins.length; i++) {
                var encodings = ['y'];
                embed(util_1.spec('unit', 1, tslib_1.__assign({ type: type }, binding, { encodings: encodings }), {
                    x: { aggregate: 'count', field: '*', type: 'quantitative' },
                    y: { bin: true },
                    color: { value: 'steelblue', field: null, type: null }
                }));
                var _a = setup('bins', i, encodings), inOut = _a.inOut, yold = _a.yold;
                testRender("bins_" + inOut + "-0");
                var zoomed = browser.execute(zoom('bins', i, inOut, null, bind === util_1.unbound)).value[0];
                var ynew = zoomed.intervals[0].extent.sort(cmp);
                chai_1.assert[assertExtent[inOut][0]](ynew[0], yold[0]);
                chai_1.assert[assertExtent[inOut][1]](ynew[1], yold[1]);
                testRender("bins_" + inOut + "-1");
            }
        });
        it('should work with temporal domains', function () {
            var values = util_1.tuples.map(function (d) { return (tslib_1.__assign({}, d, { a: new Date(2017, d.a) })); });
            var encodings = ['x'];
            for (var i = 0; i < hits.zoom.length; i++) {
                embed(util_1.spec('unit', i, tslib_1.__assign({ type: type }, binding, { encodings: encodings }), { values: values, x: { type: 'temporal' } }));
                var _a = setup('drag', i, encodings), inOut = _a.inOut, xold = _a.xold;
                testRender("temporal_" + inOut + "-0");
                var zoomed = browser.execute(zoom('zoom', i, inOut, null, bind === util_1.unbound)).value[0];
                var xnew = zoomed.intervals[0].extent.sort(cmp);
                chai_1.assert[assertExtent[inOut][0]](+xnew[0], +(new Date(xold[0])));
                chai_1.assert[assertExtent[inOut][1]](+xnew[1], +(new Date(xold[1])));
                testRender("temporal_" + inOut + "-1");
            }
        });
        it('should work with log/pow scales', function () {
            for (var i = 0; i < hits.zoom.length; i++) {
                embed(util_1.spec('unit', i, tslib_1.__assign({ type: type }, binding), {
                    x: { scale: { type: 'pow', exponent: 1.5 } },
                    y: { scale: { type: 'log' } }
                }));
                var _a = setup('drag', i, ['x', 'y']), inOut = _a.inOut, xold = _a.xold, yold = _a.yold;
                testRender("logpow_" + inOut + "-0");
                var zoomed = browser.execute(zoom('zoom', i, inOut, null, bind === util_1.unbound)).value[0];
                var xnew = zoomed.intervals[0].extent.sort(cmp);
                var ynew = zoomed.intervals[1].extent.sort(cmp);
                chai_1.assert[assertExtent[inOut][0]](xnew[0], xold[0]);
                chai_1.assert[assertExtent[inOut][1]](xnew[1], xold[1]);
                chai_1.assert[assertExtent[inOut][0]](ynew[0], yold[0]);
                chai_1.assert[assertExtent[inOut][1]](ynew[1], yold[1]);
                testRender("logpow_" + inOut + "-1");
            }
        });
        if (bind === util_1.unbound) {
            it('should work with ordinal/nominal domains', function () {
                for (var i = 0; i < hits.zoom.length; i++) {
                    embed(util_1.spec('unit', i, tslib_1.__assign({ type: type }, binding), {
                        x: { type: 'ordinal' }, y: { type: 'nominal' }
                    }));
                    var _a = setup('drag', i, ['x', 'y']), inOut = _a.inOut, xold = _a.xold, yold = _a.yold;
                    testRender("ord_" + inOut + "-0");
                    var zoomed = browser.execute(zoom('zoom', i, inOut, null, bind === util_1.unbound)).value[0];
                    var xnew = zoomed.intervals[0].extent.sort(cmp);
                    var ynew = zoomed.intervals[1].extent.sort(cmp);
                    if (inOut === 'in') {
                        chai_1.assert.isAtMost(xnew.length, xold.length);
                        chai_1.assert.isAtMost(ynew.length, yold.length);
                    }
                    else {
                        chai_1.assert.isAtLeast(xnew.length, xold.length);
                        chai_1.assert.isAtLeast(ynew.length, yold.length);
                    }
                    testRender("ord_" + inOut + "-1");
                }
            });
        }
        else {
            util_1.compositeTypes.forEach(function (specType) {
                it("should work with shared scales in " + specType + " views", function () {
                    for (var i = 0; i < hits.bins.length; i++) {
                        embed(util_1.spec(specType, 0, tslib_1.__assign({ type: type }, binding), { resolve: { scale: { x: 'shared', y: 'shared' } } }));
                        var parent_1 = util_1.parentSelector(specType, i);
                        var _a = setup(specType, i, ['x', 'y'], parent_1), inOut = _a.inOut, xold = _a.xold, yold = _a.yold;
                        var zoomed = browser.execute(zoom('bins', i, inOut, null, bind === util_1.unbound)).value[0];
                        var xnew = zoomed.intervals[0].extent.sort(cmp);
                        var ynew = zoomed.intervals[1].extent.sort(cmp);
                        chai_1.assert[assertExtent[inOut][0]](xnew[0], xold[0]);
                        chai_1.assert[assertExtent[inOut][1]](xnew[1], xold[1]);
                        chai_1.assert[assertExtent[inOut][0]](ynew[0], yold[0]);
                        chai_1.assert[assertExtent[inOut][1]](ynew[1], yold[1]);
                        testRender(specType + "_" + inOut);
                    }
                });
            });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9vbS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC1ydW50aW1lL3pvb20udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBNEI7QUFDNUIsK0JBVWdCO0FBRWhCLElBQU0sSUFBSSxHQUFHO0lBQ1gsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNiLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDYixDQUFDO0FBSUYsY0FBYyxHQUFXLEVBQUUsR0FBVyxFQUFFLElBQVcsRUFBRSxNQUFlLEVBQUUsV0FBcUI7SUFDekYsSUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7SUFDMUMsTUFBTSxDQUFDLGlCQUFlLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBSyxLQUFLLFVBQUssTUFBTSxVQUFLLFdBQVcsTUFBRyxDQUFDO0FBQy9FLENBQUM7QUFFRCxJQUFNLEdBQUcsR0FBRyxVQUFDLENBQVMsRUFBRSxDQUFTLElBQUssT0FBQSxDQUFDLEdBQUcsQ0FBQyxFQUFMLENBQUssQ0FBQztBQUU1QyxDQUFDLFlBQUssRUFBRSxjQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJO0lBQ3BDLFFBQVEsQ0FBQyxVQUFRLElBQUksb0NBQWlDLEVBQUU7UUFDdEQsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDO1FBQ3hCLElBQU0sS0FBSyxHQUFHLGNBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQixJQUFNLFVBQVUsR0FBRyxtQkFBWSxDQUFDLE9BQU8sRUFBRSxtQkFBaUIsSUFBTSxDQUFDLENBQUM7UUFDbEUsSUFBTSxPQUFPLEdBQUcsSUFBSSxLQUFLLFlBQUssR0FBRyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsR0FBRyxFQUFFLENBQUM7UUFFdkQsSUFBTSxZQUFZ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