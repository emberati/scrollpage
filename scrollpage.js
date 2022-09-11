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
  horizontal: true,
  timefunc: timefunc.ease,
  duration: 300,
  delay: 0,
  keyScrolling: true,
  edgeScrollBehavior: edgeScrollBehavior.jumpOut
}

const scrollpage = {
  touch: {active: false, x: undefined, y: undefined},
  prevent: false,
  views: [],
  currentViewIndex: 0,
  forward: scrollForward,
  backward: scrollBackward,
  next: scrollNext,
  back: scrollBack,
  scroll: scroll,
  get dx() { return this.views[0].x - scrollpage.root.getBoundingClientRect().x },
  get dy() { return this.views[0].y - scrollpage.root.getBoundingClientRect().y },
  get current() { return this.views[this.currentViewIndex] },
}

class ScrollpageError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ScrollpageError'
  }
}

function scrollForward() {
  scroll(scrollpage.views.length - 1)
}

function scrollBackward() {
  scroll(0)
}

function scrollNext() {
  if (scrollpage.currentViewIndex < scrollpage.views.length - 1) {
    scroll(scrollpage.currentViewIndex + 1)
    return
  }
  
  switch (scrollpage.options.edgeScrollBehavior) {
    case 'ignore':
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = scrollpage.root.getBoundingClientRect()
      
      dy = bounds.height
      
      window.scrollBy(dx, dy)
      return
    case 'backward':
      scrollBackward()
      return
  }
}

function scrollBack() {
  if (scrollpage.currentViewIndex > 0) {
    scroll(scrollpage.currentViewIndex - 1)
    return
  }

  switch (scrollpage.options.edgeScrollBehavior) {
    case 'ignore':
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = scrollpage.root.getBoundingClientRect()
      
      dy = bounds.y - bounds.height
      
      window.scrollBy(dx, dy)
      return
    case 'backward':
      scrollForward()
      return
  }
}

function scroll(to) {
  if (scrollpage.prevent) return

  let dx = 0.0; let dy = 0.0
  let index = 0

  if (typeof to == 'string') {  
    index = scrollpage.anchors.indexOf(to.replace('#', ''))
    if (index === -1)
      throw new ScrollpageError(`No such view: ${to}!`)
  } else {
    index = to
    if (!(index >= 0 && index <= scrollpage.views.length - 1))
      throw new ScrollpageError('Out of bounds! ' + `No such view: ${to}!`)
  }

  to = scrollpage.views[to]
  
  if (scrollpage.options.horizontal) {
    dx = scrollpage.dx - to.x
  } else {
    dy = scrollpage.dy - to.y
  }

  scrollpage.prevent = true
  scrollpage.currentViewIndex = index

  appendStyleCoords(dx, dy)

  setTimeout(() => {
    window.location.hash = scrollpage.current.anchor
    scrollpage.prevent = false
  }, scrollpage.options.duration)
}

function handleKeyScroll(e) {
  let key = e.key
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'PageDown':
      e.preventDefault()
      scrollpage.next()
      break
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'PageUp':
      e.preventDefault()
      scrollpage.back()
      break
    case 'Home':
      e.preventDefault()
      scrollpage.backward()
      break
    case 'End':
      e.preventDefault()
      scrollpage.forward()
      break
    case '1':case '2':case '3':
    case '4':case '5':case '6':
    case '7':case '8':case '9':
      try {
        e.preventDefault()
        scrollpage.scroll(parseInt(key) - 1)        
      } catch (e) {
        console.log('Key scroll navigation: slide', key, 'is not exist!')
      }
  }
}

function handleWheelScroll(e) {
  if (e.ctrlKey || scrollpage.prevent) return
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
  if (scrollpage.touch.active || scrollpage.prevent) return
  scrollpage.touch.active = true
  e.preventDefault()

  console.log('touch start');
  
  scrollpage.root.classList.add('touch')
  let coords = getTouchCoords(e)
  scrollpage.touch.x = coords.x
  scrollpage.touch.y = coords.y
}

function handleTouchEnd(e) {
  scrollpage.touch.active = false
  e.preventDefault()
  
  scrollpage.root.classList.remove('touch')
  scrollpage.touch.x = undefined
  scrollpage.touch.y = undefined

  const root = scrollpage.root.getBoundingClientRect()
  const current = scrollpage.current
  
  const f = 200
  let vc = current.x + current.width / 2
  let f1 = (root.width - f) / 2
  let f2 = (root.width + f) / 2

  if (vc > f1 && vc < f2) {
    console.log('NO SCROLLING')
    scroll(scrollpage.current.index) // !!!!
    return
  }

  if (vc < f1) {
    scrollNext()
    return
  }

  if (vc > f2) {
    scrollBack()
    return
  }
}

function handleTouchMove(e) {
  if (!scrollpage.touch.active || scrollpage.prevent) return
  let dx = 0
  let dy = 0
  let coords = getTouchCoords(e)
  
  if (!scrollpage.touch.x || !scrollpage.touch.y) return

  if (scrollpage.options.horizontal) {
    dx = scrollpage.dx + (coords.x - scrollpage.touch.x)
  } else {
    dy = scrollpage.dy + (coords.y - scrollpage.touch.y)
  }

  scrollpage.touch.x = coords.x
  scrollpage.touch.y = coords.y
  appendStyleCoords(dx, dy)
}

function getTouchCoords(e) {
  if (e instanceof TouchEvent) {
    if (e.touches.length > 1) return
    e = e.touches[0]
    return {x: e.screenX, y: e.screenY}
  }

  if (e instanceof MouseEvent) {
    return {x: e.screenX, y: e.screenY}
  }
}

function appendStyleCoords(dx, dy) {
  scrollpage.root.style.setProperty('--dx', `${parseInt(dx)}px`)
  scrollpage.root.style.setProperty('--dy', `${parseInt(dy)}px`)
}

function init(root, selector, anchors, options) {

  scrollpage.root = root
  scrollpage.selector = selector
  scrollpage.anchors = anchors
  scrollpage.options = options ? {
    horizontal: options.horizontal || defaults.horizontal,
    timefunc: options.timefunc || defaults.timefunc,
    duration: options.duration || defaults.duration,
    delay: options.delay || defaults.delay,
    keyScrolling: options.keyScrolling || defaults.keyScrolling,
    edgeScrollBehavior: options.edgeScrollBehavior || defaults.edgeScrollBehavior
  } : defaults

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
  scrollpage.root.addEventListener('mouseleave', handleTouchEnd, opts)
  scrollpage.root.addEventListener('mousemove', handleTouchMove, opts)

  scrollpage.root.addEventListener('wheel', handleWheelScroll, {passive: false})

  return scrollpage
}

function destroy() {
  window.removeEventListener('keydown', handleKeyScroll)
  scrollpage.root.removeEventListener('wheel', handleWheelScroll)
}

export default init

export {
  OUTER_DIV_CLASSNAME,
  INNER_DIV_CLASSNAME
}