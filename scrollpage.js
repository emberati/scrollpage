/* eslint-disable */
const OUTER_DIV_CLASSNAME = 'scrollpage-outer'
const INNER_DIV_CLASSNAME = 'scrollpage-inner'

const timefunc = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  linear: 'linear',
  inert: 'cubic-bezier(.17,.67,.83,.67)',
  bounce: 'cubic-bezier(.55,-.55,.55,1.55)',
  bounceIn: 'cubic-bezier(.55,-.55,.55,1)',
  bounceOut: 'cubic-bezier(.5,0,.5,1.55)',
}

const edgeScrollBehavior = {
  jumpOut: 'jumpOut',
  backward: 'backward',
  ignore: 'ignore'
}

const defaults = {
  timefunc: timefunc.inert,
  duration: 500,
  delay: 0,
  keyScrolling: true,
  edgeScrollBehavior: edgeScrollBehavior.ignore,
}

class ScrollpageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ScrollpageError'
  }
}

function scrollForward() {
  scroll(this.views.length - 1)
}

function scrollBackward() {
  scroll(0)
}

function scrollNext() {
  if (this.index < this.views.length - 1) {
    scroll(this.index + 1)
    return
  }
  
  switch (this.options.edgeScrollBehavior) {
    case 'ignore':
      redraw()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = this.root.getBoundingClientRect()
      
      dy = bounds.height

      redraw()
      window.scrollBy(dx, dy)
      return
    case 'backward':
      scrollBackward()
      return
  }
}

function scrollBack() {
  if (this.index > 0) {
    scroll(this.index - 1)
    return
  }

  switch (this.options.edgeScrollBehavior) {
    case 'ignore':
      redraw()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = this.root.getBoundingClientRect()
      
      dy = bounds.y - bounds.height

      redraw()
      window.scrollBy(dx, dy)
      return
    case 'backward':
      scrollForward()
      return
  }
}

function scroll(to) {
  if (this.prevent) return

  let dx = 0.0; let dy = 0.0
  let index = undefined

  this.prevent = true

  try {
    index = indexOf(to)
  } catch (err) {
    index = this.index
    this.prevent = false
    return
  }

  this.index = index

  redraw()

  setTimeout(() => {
    window.location.hash = this.current.anchor
    this.prevent = false
  }, this.options.duration)
}

function redraw() {
  // It may need check on if isLandscape, then update dx or dy
  let dx = this.dx - this.current.x
  let dy = this.dy - this.current.y

  appendStyleCoords(dx, dy)
}

function indexOf(anchor) {
  let index = 0
  
  if (typeof anchor == 'string') {  
    index = this.anchors.indexOf(to.replace('#', ''))
    if (index === -1)
      throw new ScrollpageError(`No such view: ${anchor}!`)
  } else if (typeof anchor == 'number') {
    index = anchor
    if (!(index >= 0 && index <= this.views.length - 1))
      throw new ScrollpageError('Out of bounds! ' + `No such view: ${anchor}!`)
  } else {
    index = anchor.index
    if (index == undefined)
      throw new ScrollpageError(`Invalid view object: ${anchor}!`)
  }

  return index
}

function handleKeyScroll(e) {
  let key = e.key
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'PageDown':
      e.preventDefault()
      this.next()
      break
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault()
      this.back()
      break
    case 'Home':
      e.preventDefault()
      this.backward()
      break
    case 'End':
      e.preventDefault()
      this.forward()
      break
    case '1':case '2':case '3':
    case '4':case '5':case '6':
    case '7':case '8':case '9':
      e.preventDefault()
      this.scroll(parseInt(key) - 1)
      break
  }
}

function handleWheelScroll(e) {
  if (e.ctrlKey || this.prevent) return
  e.preventDefault()
  let dx = e.deltaX
  let dy = e.deltaY
  
  if (dx > 10 || dy > 10) {
    scrollNext()
  } else if (dx < -10 || dy < -10) {
    scrollBack()
  }
}

function handleTouchStart(e) {
  if (this.touch.active || this.prevent) return
  this.touch.active = true
  e.preventDefault()

  this.root.classList.add('touch')
  let coords = getTouchCoords(e)
  this.touch.x = coords.x
  this.touch.y = coords.y
}

function handleTouchEnd(e) {
  e.preventDefault()
  deactiveTouch()

  const root = this.root.getBoundingClientRect()
  const current = this.current
  
  const f = 200
  let vc = current.x + current.width / 2
  let hc = current.y + current.height / 2

  let f1 = (root.width - f) / 2
  let f2 = (root.width + f) / 2
  let f3 = (root.height - f) / 2
  let f4 = (root.height + f) / 2

  if (this.isLandscape && vc > f1 && vc < f2) {
    redraw()
    return
  } else {
    if (vc < f1) {
      scrollNext()
      return
    }
  
    if (vc > f2) {
      scrollBack()
      return
    }
  }
  
  if (hc > f3 && hc < f4) {
    redraw()
    return
  } else {
    if (hc < f3) {
      scrollNext()
      return
    }
  
    if (hc > f4) {
      scrollBack()
      return
    }
  }
}

function handleTouchMove(e) {
  if (!this.touch.active || this.prevent) return
  
  let dx = 0; let dy = 0
  let coords = getTouchCoords(e)
  
  if (!this.touch.x || !this.touch.y) return

  if (this.isLandscape) {
    dx = this.dx + (coords.x - this.touch.x)
  } else {
    dy = this.dy + (coords.y - this.touch.y)
  }

  this.touch.x = coords.x
  this.touch.y = coords.y
  appendStyleCoords(dx, dy)
}

function onKeyScroll(e, handler) {
  handler(e)
}

function deactiveTouch() {
  this.touch.active = false
  this.root.classList.remove('touch')
  this.touch.x = undefined
  this.touch.y = undefined
  redraw()
}

function getTouchCoords(e) {
  if (e instanceof TouchEvent) {
    if (e.touches.length > 1) return
    e = e.touches[0]
  }
  return {x: e.screenX, y: e.screenY}
}

function appendStyleCoords(dx, dy) {
  this.root.style.setProperty('--dx', `${parseInt(dx)}px`)
  this.root.style.setProperty('--dy', `${parseInt(dy)}px`)
}

function init(root, selector, anchors, options) {
  console.log('Initializing this...')

  const scrollpage = {
    root: root,
    selector: selector,
    anchors: anchors,
    options: options ? {
      timefunc: options.timefunc || defaults.timefunc,
      duration: options.duration || defaults.duration,
      delay: options.delay || defaults.delay,
      keyScrolling: options.keyScrolling || defaults.keyScrolling,
      edgeScrollBehavior: options.edgeScrollBehavior || defaults.edgeScrollBehavior
    } : defaults,
    touch: {active: false, x: undefined, y: undefined},
    prevent: false,
    views: [],
    index: 0,
    forward: scrollForward,
    backward: scrollBackward,
    next: scrollNext,
    back: scrollBack,
    scroll: scroll,
    destroy: destroy,
    redraw: redraw,
    get dx() { return this.views[0].x - this.root.getBoundingClientRect().x },
    get dy() { return this.views[0].y - this.root.getBoundingClientRect().y },
    get current() { return this.views[this.index] },
    get isLandscape() { return this.views[0].y === this.views[this.views.length - 1].y }
  }

  // todo: make root subnode mandatory with checks
  const inner = root.children[0]
  const childrens = scrollpage.selector?
    inner.querySelectorAll('.'.concat(scrollpage.selector)) :
    inner.children

  // Check if anchors and views are valid

  if (!(scrollpage.anchors && scrollpage.anchors.length))
    throw new ScrollpageError("List of anchors (element's ids) might not be empty!")

  if (!(childrens.length === scrollpage.anchors.length))
    throw new ScrollpageError(`Count of anchors might be equal to \`${INNER_DIV_CLASSNAME}\` component childrens!`)

  // Complating the formation of view objects

  if (scrollpage.views.length === 0) {
    for (let i = 0; i < childrens.length; i++) {
      let view = {
        element: childrens[i],
        anchor: scrollpage.anchors[i],
        index: i,
        get x() { return this.element.getBoundingClientRect().x },
        get y() { return this.element.getBoundingClientRect().y },
        get width() { return this.element.getBoundingClientRect().width },
        get height() { return this.element.getBoundingClientRect().height }
      }
      view.element.classList.add('view')
      view.element.id = view.anchor
      scrollpage.views.push(view)
    }
  }

  scrollpage.root.style.setProperty('--duration', `${scrollpage.options.duration}ms`)
  scrollpage.root.style.setProperty('--timefunc', scrollpage.options.timefunc)
  scrollpage.root.style.setProperty('--delay', scrollpage.options.delay)

  if (scrollpage.options.keyScrolling)
    window.addEventListener('keydown', handleKeyScroll, false)

  let opts = {
    capture: false,
    passive: false
  }

  scrollpage.root.addEventListener('touchstart', handleTouchStart, opts)
  scrollpage.root.addEventListener('touchend', handleTouchEnd, opts)
  scrollpage.root.addEventListener('touchmove', handleTouchMove, opts)
  scrollpage.root.addEventListener('mousedown', handleTouchStart, opts)
  scrollpage.root.addEventListener('mouseup', handleTouchEnd, opts)
  scrollpage.root.addEventListener('mouseleave', deactiveTouch, opts)
  scrollpage.root.addEventListener('mousemove', handleTouchMove, opts)
  scrollpage.root.addEventListener('wheel', handleWheelScroll, {passive: false})
  window.addEventListener('resize', redraw)

  return scrollpage
}

function destroy() {
  this.root.removeEventListener('touchstart', handleTouchStart)
  this.root.removeEventListener('touchend', handleTouchEnd)
  this.root.removeEventListener('touchmove', handleTouchMove)
  this.root.removeEventListener('mousedown', handleTouchStart)
  this.root.removeEventListener('mouseup', handleTouchEnd)
  this.root.removeEventListener('mouseleave', deactiveTouch)
  this.root.removeEventListener('mousemove', handleTouchMove)
  this.root.removeEventListener('wheel', handleWheelScroll)
  window.removeEventListener('resize', redraw)
  console.log('Scrollpage has been destroyed...')
}

export default init

export {
  OUTER_DIV_CLASSNAME,
  INNER_DIV_CLASSNAME
}