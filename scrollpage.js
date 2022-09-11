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
  timefunc: timefunc.bounceIn,
  duration: 700,
  delay: 0,
  keyScrolling: true,
  edgeScrollBehavior: edgeScrollBehavior.ignore,
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
  destroy: destroy,
  refresh: refresh,
  get dx() { return this.views[0].x - scrollpage.root.getBoundingClientRect().x },
  get dy() { return this.views[0].y - scrollpage.root.getBoundingClientRect().y },
  get current() { return this.views[this.currentViewIndex] },
  get isLandscape() { return scrollpage.views[0].y === scrollpage.views[scrollpage.views.length - 1].y }
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
      refresh()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = scrollpage.root.getBoundingClientRect()
      
      dy = bounds.height

      refresh()
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
      refresh()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = scrollpage.root.getBoundingClientRect()
      
      dy = bounds.y - bounds.height

      refresh()
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

  scrollpage.prevent = true
  scrollpage.currentViewIndex = anchorToIndex(to)
  to = scrollpage.views[scrollpage.currentViewIndex]
  
  dx = scrollpage.dx - to.x
  dy = scrollpage.dy - to.y

  console.log('delta:', dx, dy)
  appendStyleCoords(dx, dy)

  setTimeout(() => {
    window.location.hash = scrollpage.current.anchor
    scrollpage.prevent = false
  }, scrollpage.options.duration)
}

function refresh() {
  // It may need check on if isLandscape, then update dx or dy
  let dx = scrollpage.dx - scrollpage.current.x
  let dy = scrollpage.dy - scrollpage.current.y
  console.log('Refreshing view', scrollpage.current.anchor, '...');

  appendStyleCoords(dx, dy)
}

function anchorToIndex(anchor) {
  let index = 0
  
  if (typeof anchor == 'string') {  
    index = scrollpage.anchors.indexOf(to.replace('#', ''))
    if (index === -1)
      throw new ScrollpageError(`No such view: ${anchor}!`)
  } else {
    index = anchor
    if (!(index >= 0 && index <= scrollpage.views.length - 1))
      throw new ScrollpageError('Out of bounds! ' + `No such view: ${anchor}!`)
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

  scrollpage.root.classList.add('touch')
  let coords = getTouchCoords(e)
  scrollpage.touch.x = coords.x
  scrollpage.touch.y = coords.y
}

function handleTouchEnd(e) {
  e.preventDefault()
  deactiveTouch()

  const root = scrollpage.root.getBoundingClientRect()
  const current = scrollpage.current
  
  const f = 200
  let vc = current.x + current.width / 2
  let hc = current.y + current.height / 2

  let f1 = (root.width - f) / 2
  let f2 = (root.width + f) / 2
  let f3 = (root.height - f) / 2
  let f4 = (root.height + f) / 2

  if (scrollpage.isLandscape && vc > f1 && vc < f2) {
    refresh()
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
    refresh()
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
  if (!scrollpage.touch.active || scrollpage.prevent) return
  
  let dx = 0; let dy = 0
  let coords = getTouchCoords(e)
  
  if (!scrollpage.touch.x || !scrollpage.touch.y) return

  if (scrollpage.isLandscape) {
    dx = scrollpage.dx + (coords.x - scrollpage.touch.x)
  } else {
    dy = scrollpage.dy + (coords.y - scrollpage.touch.y)
  }

  scrollpage.touch.x = coords.x
  scrollpage.touch.y = coords.y
  appendStyleCoords(dx, dy)
}

function deactiveTouch() {
  scrollpage.touch.active = false
  scrollpage.root.classList.remove('touch')
  scrollpage.touch.x = undefined
  scrollpage.touch.y = undefined
  refresh()
}

function getTouchCoords(e) {
  if (e instanceof TouchEvent) {
    if (e.touches.length > 1) return
    e = e.touches[0]
  }
  return {x: e.screenX, y: e.screenY}
}

function appendStyleCoords(dx, dy) {
  scrollpage.root.style.setProperty('--dx', `${parseInt(dx)}px`)
  scrollpage.root.style.setProperty('--dy', `${parseInt(dy)}px`)
}

function init(root, selector, anchors, options) {
  console.log('Initializing Scrollpage...')

  scrollpage.root = root
  scrollpage.selector = selector
  scrollpage.anchors = anchors
  scrollpage.options = options ? {
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
  window.addEventListener('resize', refresh)

  return scrollpage
}

function destroy() {
  scrollpage.root.removeEventListener('touchstart', handleTouchStart)
  scrollpage.root.removeEventListener('touchend', handleTouchEnd)
  scrollpage.root.removeEventListener('touchmove', handleTouchMove)
  scrollpage.root.removeEventListener('mousedown', handleTouchStart)
  scrollpage.root.removeEventListener('mouseup', handleTouchEnd)
  scrollpage.root.removeEventListener('mouseleave', deactiveTouch)
  scrollpage.root.removeEventListener('mousemove', handleTouchMove)
  scrollpage.root.removeEventListener('wheel', handleWheelScroll)
  window.removeEventListener('resize', refresh)
  console.log('Scrollpage has been destroyed...')
}

export default init

export {
  OUTER_DIV_CLASSNAME,
  INNER_DIV_CLASSNAME
}