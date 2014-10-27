// https://github.com/libgdx/libgdx/blob/master/gdx/src/com/badlogic/gdx/scenes/scene2d/utils/ScissorStack.java

PIXI.ScissorStack = function(gl, opt) {
    if (!(this instanceof PIXI.ScissorStack))
        return new PIXI.ScissorStack(gl, opt)

    opt=opt||{}
    this.gl = gl
    this.scissors = []
}

PIXI.ScissorStack.prototype.push = (function() {
    function fix(rect) {
        var out = { x: 0, y: 0, width: 0, height: 0 }
        out.x = Math.round(rect.x)
        out.y = Math.round(rect.y)
        out.width = Math.round(rect.width)
        out.height = Math.round(rect.height)
        if (out.width < 0) {
            out.width = -out.width
            out.x -= out.width
        }
        if (out.height < 0) {
            out.height = -out.height
            out.y -= out.height
        }
        return out
    }

    return function(rect) {
        var scissor = fix(rect)

        if (this.scissors.length === 0) {
            if (scissor.width < 1 || scissor.height < 1)
                return false
            this.gl.enable(this.gl.SCISSOR_TEST)
        } else {
            // merge scissors
            var parent = this.scissors[this.scissors.length-1]
            var minX = Math.max(parent.x, scissor.x)
            var maxX = Math.min(parent.x + parent.width, scissor.x + scissor.width)
            if (maxX - minX < 1) return false

            var minY = Math.max(parent.y, scissor.y)
            var maxY = Math.min(parent.y + parent.height, scissor.y + scissor.height)
            if (maxY - minY < 1) return false

            scissor.x = minX
            scissor.y = minY
            scissor.width = maxX - minX
            scissor.height = Math.max(1, maxY - minY)
        }
        this.scissors.push(scissor)
        this.gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height)
        return true
    }
})();

PIXI.ScissorStack.prototype.pop = function() {
    if (this.scissors.length === 0)
        return
    var old = this.scissors.pop()
    if (this.scissors.length === 0)
        this.gl.disable(this.gl.SCISSOR_TEST)
    else {
        var sc = this.scissors.peek()
        this.gl.scissor(sc.x, sc.y, sc.width, sc.height)
    }
    return old
}

PIXI.ScissorStack.prototype.peek = function() {
    return this.scissors.peek()
}