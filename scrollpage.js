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
  index: 0,
  deadZone: 200,
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
  this.scroll(this.views.length - 1)
}

function scrollBackward() {
  this.scroll(0)
}

function scrollNext() {
  if (this.index < this.views.length - 1) {
    this.scroll(this.index + 1)
    return
  }
  
  switch (this.options.edgeScrollBehavior) {
    case 'ignore':
      this.redraw()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = this.root.getBoundingClientRect()
      
      dy = bounds.height

      this.redraw()
      window.scrollBy(dx, dy)
      return
    case 'backward':
      this.backward()
      return
  }
}

function scrollBack() {
  if (this.index > 0) {
    this.scroll(this.index - 1)
    return
  }

  switch (this.options.edgeScrollBehavior) {
    case 'ignore':
      this.redraw()
      return
    case 'jumpOut':
      var dx = 0; var dy = 0
      var bounds = this.root.getBoundingClientRect()
      
      dy = bounds.y - bounds.height

      this.redraw()
      window.scrollBy(dx, dy)
      return
    case 'backward':
      this.forward()
      return
  }
}

function scroll(to) {
  if (this.prevent) return
  this.prevent = true

  try {
    let index = this.indexOf(to)
    if (index === this.index) {
      this.prevent = false
      return
    }
    if (this.current.leave) this.current.leave()
    this.index = index
    this.redraw()
  } catch (err) {
    this.prevent = false
    return
  }
  
  setTimeout(() => {
    if (this.current.enter) this.current.enter()
    this.prevent = false
    // HASH SETTING ISSUES DISPLAY BUGS
    // window.location.hash = this.current.anchor
  }, this.options.duration)
}

function redraw() {
  // It may need check on if isLandscape, then update dx or dy
  let dx = this.isLandscape ? parseInt(this.views[0].x - this.current.x) : 0
  let dy = !this.isLandscape ? parseInt(this.views[0].y - this.current.y) : 0

  // console.log(`Redrawing on dx, dy ${dx}, ${dy}`)

  this.appendStyleCoords(dx, dy)
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

function handleKeyScroll(scp) {
  return function(e) {
    let key = e.key
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault()
        scp.next()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault()
        scp.back()
        break
      case 'Home':
        e.preventDefault()
        scp.backward()
        break
      case 'End':
        e.preventDefault()
        scp.forward()
        break
      case '1':case '2':case '3':
      case '4':case '5':case '6':
      case '7':case '8':case '9':
        e.preventDefault()
        scp.scroll(parseInt(key) - 1)
        break
    }
  }
}

function handleWheelScroll(scp) {
  return function(e) {
    if (e.ctrlKey || scp.prevent) return
    e.preventDefault()
    let dx = e.deltaX
    let dy = e.deltaY
    
    if (dx > 10 || dy > 10) {
      scp.next()
    } else if (dx < -10 || dy < -10) {
      scp.back()
    }
  }
}

function handleTouchStart(scp) {
  return function(e) {
    if (scp.touch.active || scp.prevent) return
    scp.touch.active = true
    e.preventDefault()

    scp.root.classList.add('touch')
    let coords = getTouchCoords(e)
    scp.touch.x = coords.x
    scp.touch.y = coords.y
  }
}

function handleTouchEnd(scp) {
  return function(e) {
    e.preventDefault()
    scp.deactiveTouch()

    const root = scp.root.getBoundingClientRect()
    const current = scp.current
    
    let vc = current.x + current.width / 2
    let hc = current.y + current.height / 2

    // scp.root.style.position = 'relative'

    // createMarker = (name, horiz, color) => {
    //   const marker = document.createElement('div')
    //   marker.style.width = horiz ? '100%' : '0'
    //   marker.style.height = horiz ? '0' : '100%'
    //   marker.style.position = 'absolute'
    //   marker.style.boxShadow = '0 0 0 0.5px ' + color
    //   marker.setAttribute('class', name)
    //   return marker
    // }

    // setMarkerPosition = (marker, left, top) => {
    //   marker.style.left = `${left}px`
    //   marker.style.top = `${top}px`
    // }

    // marker = (name, horiz, color) =>  {
    //   let marker = scp.root.querySelector('.' + name)
    //   if (!marker) marker = createMarker(name, horiz, color)

    //   return {
    //     pos: ({left, right, top, bottom}) => {
    //       if (left || left === 0) marker.style.left = typeof left === 'number' ? left + 'px' : left
    //       if (right || right === 0) marker.style.right = typeof right === 'number' ? right + 'px' : right
    //       if (top || top === 0) marker.style.top = typeof top === 'number' ? top + 'px' : top
    //       if (bottom || bottom === 0) marker.style.bottom = typeof bottom === 'number' ? bottom + 'px' : bottom
    //     },
    //     self: marker
    //   }
    // }

    // const vline = marker('vline', false, 'red').self
    // const hline = marker('hline', true, 'green').self
    // const fline1 = marker('fline1', false, 'blue').self
    // const fline2 = marker('fline2', false, 'blue').self
    // const fline3 = marker('fline3', true, 'purple').self
    // const fline4 = marker('fline4', true, 'purple').self

    // scp.root.appendChild(vline)
    // scp.root.appendChild(hline)
    // scp.root.appendChild(fline1)
    // scp.root.appendChild(fline2)
    // scp.root.appendChild(fline3)
    // scp.root.appendChild(fline4)

    const dz = scp.options.deadZone

    let f1 = (root.width - dz) / 2
    let f2 = (root.width + dz) / 2
    let f3 = (root.height - dz) / 2
    let f4 = (root.height + dz) / 2

    // console.log(`x, dx: ${current.x}, ${scp.dx}; y, dy: ${current.y}, ${scp.dy}`);
    // console.log(`w, h: ${current.width}, ${current.height}; diff: ${f2 - f1} of real ${dz}`)

    // marker('vline').pos({left: vc, top: 0})
    // marker('hline').pos({top: hc})
    // marker('fline1').pos({left: f1, top: 0})
    // marker('fline2').pos({left: f2, top: 0})
    // marker('fline3').pos({left: 0, top: f3})
    // marker('fline4').pos({left: 0, top: f4})

    if (scp.isLandscape && vc > f1 && vc < f2) {
      scp.redraw()
      console.log('NO SCROLLING')
      return
    } else {
      if (vc < f1) {
        scp.next()
        return
      }
    
      if (vc > f2) {
        scp.back()
        return
      }
    }

    if (hc > f3 && hc < f4) {
      scp.redraw()
      return
    } else {
      if (hc < f3) {
        scp.next()
        return
      }
    
      if (hc > f4) {
        scp.back()
        return
      }
    }
  }
}

function handleTouchMove(scp) {
  return function(e) {
    if (!scp.touch.active || scp.prevent) return
  
    let dx = 0; let dy = 0
    let coords = getTouchCoords(e)
    
    if (!scp.touch.x || !scp.touch.y) return
  
    if (scp.isLandscape) {
      // console.log('coords.x:', coords.x, 'scp.touch.x:', scp.touch.x);
      console.log(scp.dx, coords.x - scp.touch.x);
      dx = scp.dx + (coords.x - scp.touch.x)
    } else {
      dy = scp.dy + (coords.y - scp.touch.y)
    }
  
    scp.touch.x = coords.x
    scp.touch.y = coords.y
    scp.appendStyleCoords(dx, dy)
  }
}

function handleResize(scp) {
  return function() {
    scp.redraw()
  }
}

function deactiveTouch() {
  this.touch.active = false
  this.root.classList.remove('touch')
  this.touch.x = undefined
  this.touch.y = undefined
  this.redraw()
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
  const scrollpage = {
    index: 0,
    root: root,
    selector: selector,
    anchors: anchors,
    options: options ? {
      index: options.index || defaults.index,
      deadZone: options.deadZone || defaults.deadZone,
      timefunc: timefunc[options.timefunc] || defaults.timefunc,
      duration: options.duration || defaults.duration,
      delay: options.delay || defaults.delay,
      keyScrolling: options.keyScrolling || defaults.keyScrolling,
      edgeScrollBehavior: options.edgeScrollBehavior || defaults.edgeScrollBehavior
    } : defaults,
    touch: {active: false, x: undefined, y: undefined},
    prevent: false,
    views: [],
    forward: scrollForward,
    backward: scrollBackward,
    next: scrollNext,
    back: scrollBack,
    scroll: scroll,
    indexOf: indexOf,
    appendStyleCoords: appendStyleCoords,
    deactiveTouch: deactiveTouch,
    destroy: destroy,
    redraw: redraw,
    get dx() {
      const firsViewRect = this.views[0].element.getBoundingClientRect()
      const rootRect = this.root.getBoundingClientRect()
      return firsViewRect.x - rootRect.x + (firsViewRect.width - rootRect.width) / 2
    },
    get dy() {
      const firsViewRect = this.views[0].element.getBoundingClientRect()
      const rootRect = this.root.getBoundingClientRect()
      return firsViewRect.y - rootRect.y + (firsViewRect.height - rootRect.height) / 2
    },
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
    const getBoundsOf = (of) => {
      return of.element.getBoundingClientRect()
    }
    for (let i = 0; i < childrens.length; i++) {
      const view = {
        element: childrens[i],
        anchor: scrollpage.anchors[i],
        index: i,
        get x() { return getBoundsOf(this).x - scrollpage.root.getBoundingClientRect().x },
        get y() { return getBoundsOf(this).y - scrollpage.root.getBoundingClientRect().y },
        get width() { return getBoundsOf(this).width },
        get height() { return getBoundsOf(this).height }
      }
      view.element.classList.add('view')
      view.element.id = view.anchor
      scrollpage.views.push(view)
    }
  }

  scrollpage.root.style.setProperty('--duration', `${scrollpage.options.duration}ms`)
  scrollpage.root.style.setProperty('--timefunc', scrollpage.options.timefunc)
  scrollpage.root.style.setProperty('--delay', scrollpage.options.delay)

  let opts = {
    capture: false,
    passive: false
  }

  scrollpage.handlers = {
    'touchstart': handleTouchStart(scrollpage),
    'touchend': handleTouchEnd(scrollpage),
    'touchmove': handleTouchMove(scrollpage),
    'mousedown': handleTouchStart(scrollpage),
    'mouseup': handleTouchEnd(scrollpage),
    'mouseleave': handleTouchEnd(scrollpage),
    'mousemove': handleTouchMove(scrollpage),
    'wheel': handleWheelScroll(scrollpage),
    'resize': handleResize(scrollpage),
    'keydown': handleKeyScroll(scrollpage)
  }

  scrollpage.root.addEventListener('touchstart', scrollpage.handlers['touchstart'], opts)
  scrollpage.root.addEventListener('touchend', scrollpage.handlers['touchend'], opts)
  scrollpage.root.addEventListener('touchmove', scrollpage.handlers['touchmove'], opts)
  scrollpage.root.addEventListener('mousedown', scrollpage.handlers['mousedown'], opts)
  scrollpage.root.addEventListener('mouseup', scrollpage.handlers['mouseup'], opts)
  scrollpage.root.addEventListener('mouseleave', scrollpage.handlers['mouseleave'], opts)
  scrollpage.root.addEventListener('mousemove', scrollpage.handlers['mousemove'], opts)
  scrollpage.root.addEventListener('wheel', scrollpage.handlers['wheel'], {passive: false})
  window.addEventListener('resize', scrollpage.handlers['resize'])
  if (scrollpage.options.keyScrolling)
    window.addEventListener('keydown', scrollpage.handlers['keydown'])

  scrollpage.scroll(scrollpage.options.index)
  // scrollpage.views.forEach(e => {
  //   console.log(e.anchor, e.height)
  //   console.log(scrollpage.dy);
  // })
  return scrollpage
}

function destroy() {
  this.root.removeEventListener('touchstart', this.handlers['touchstart'])
  this.root.removeEventListener('touchend', this.handlers['touchend'])
  this.root.removeEventListener('touchmove', this.handlers['touchmove'])
  this.root.removeEventListener('mousedown', this.handlers['mousedown'])
  this.root.removeEventListener('mouseup', this.handlers['mouseup'])
  this.root.removeEventListener('mouseleave', this.handlers['mouseleave'])
  this.root.removeEventListener('mousemove', this.handlers['mousemove'])
  this.root.removeEventListener('wheel', this.handlers['wheel'])

  window.removeEventListener('keydown', this.handlers['keydown'])
  window.removeEventListener('resize', this.handlers['resize'])
  
  console.log('Scrollpage has been destroyed...')
}

// export default init

// export {
//   OUTER_DIV_CLASSNAME,
//   INNER_DIV_CLASSNAME
// }