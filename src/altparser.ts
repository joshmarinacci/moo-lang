import test from "node:test";
import assert from "node:assert";
import {
    Exp,
    Identifier,
    InputStream, ListOf,
    Lit,
    type Rule,
    Seq,
    withProduction,
} from "./parser.ts";
import {Id, Num, Stmt} from "./ast.ts";


let MethodArgs = ListOf(Exp,Lit(","));

export let MethodCall = withProduction(
    Seq(Identifier,Lit("."),Identifier,Lit("("),MethodArgs,Lit(")"))
    ,(res)=> {
        return Stmt(
            res.production[0],
            res.production[2],
            ...res.production[4],
        )
    })

function match(source:string, rule:Rule) {
    // console.log("=======")
    let input = new InputStream(source,0);
    return rule(input).succeeded()
}
function produces(source:string, rule:Rule) {
    let input = new InputStream(source,0);
    return rule(input).production
}

test("parse method call",() => {
    assert.deepStrictEqual(produces("4",MethodArgs),[Num(4)]);
    assert.deepStrictEqual(produces("foo.bar(5);",MethodCall),Stmt(Id('foo'),Id('bar'),Num(5)))
    assert.deepStrictEqual(produces("foo.bar(5,6);",MethodCall),Stmt(Id('foo'),Id('bar'),Num(5),Num(6)))
    /*

        PointProto = Object.clone()
        PointProto.magnitude = () {
            return Math.sqrt((this.x*this.x)+(this.y*this.y))
        }
        PointProto.add = (pt) {
            return Point.make(pt.x+this.x,pt.y+this.y)
        }
        Point = PointProto.clone()
        Point.make = (x,y) {
            pt = Point.clone();
            pt.x = x
            pt.y = y
            return pt
        }
        pt = Point.make(1,1)
        Debug.equals(pt.x,1)
        Debug.equals(pt.magnitude(),1)
        pt2 = Point.make(6,6)
        Debug.equals(pt2.y,6)
        pt3 = pt.add(pt2)
        Debug.equals(pt3.x,7)


        if 4 < 5 then 88 else 99
        if (4<5) then { 88 } else { 99 }
        answer = if 4<5 then 88 else 99

        Math := Object clone.
        Math setSlot "fib" [n|
            (n == 0) ifTrue [ return 0. ].
            (n == 1) ifTrue [ return 1. ].
            (Math fib ( n - 2 ) ) + (Math fib (n - 1 ) ).
        ].
        Math fib 6.

        fib = (n) {
            n < 2 then 1 else { fib(n-2) + fib(n-1) }
        }


        sphere = Object.clone()
        sphere.intersection = (ray) {
            eye = this.point - ray.point
            v = eye.dot(ray.vector)
            eoDot = eye.dot(eye)
            discr = this.radius^2 - eoDot + v*v
            return if discr < 0 then nil else v - sqrt(discr)
        }

        sphere.normal = (pos) { return (pos - sphere.point).unit() }
        sphere.normal = (pos) => (pos - sphere.point).unit()

        scene.intersect = (ray) {
            let closest = {Infinity, nil}
            this.objects.forEach((obj) => {
                dist = obj.intersection(ray)
                if (dist and dist < closest)
                    closest = dist
                    target = obj
            })
            return (closest, target)
        }
        scene.intersect = (ray) {
            this.objects.map(obj => (dist:obj.intersect(ray),target:obj)
                .filter(inter => inter.target != nil)
                .smallestBy(inter => inter.distance)
                .first()
        }
        trace = (ray, scene, depth) {
            if depth < 3 return WHITE

            inter = scene.intersect(ray)
            if inter.distance == Infinity return WHITE

            t = ray.point + ray.vector * inter.dist
            return shade ( ray, scene, inter, t, inter.target.normal(t), depth)
        }

        shade = (ray, scene, inter, t, normal, depth) {
            b = inter.target.color
            c = Vector.ZERO
            lambert = 0
            if inter.target.hasLambert()
                scene.lights.forEach( (light) => {
                    if light.visibleAt(t, scene) {
                        lambert += (light.point - t).dot(normal)
                    }
                })
            if inter.target.hasSpecular() {
                reflected = Ray.reflect(t,ray.vector,normal)
                color = trace(reflected, scene, depth+1)
                if color
                    c += color * target.specular
                lambert = lambert.min(1)
            }
            return c + b * lambert * target.lambert + b * target.ambient
        }

     */
});
