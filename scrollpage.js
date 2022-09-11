const OUTER_DIV_CLASSNAME = 'scrollpage-outer'
const INNER_DIV_CLASSNAME = 'scrollpage-inner'

class ScrollpageError extends Error {
  constructor(message) {
    super(message)
    this.name ='ScrollViewError'
  }
}

function scrollForward() {
  
}

function scrollBackward() {
  
}

function scrollTo(scrollpage, options, index) {
  let dx = 0;
  inner.style.setProperty('--dx', dx)
  inner.style.setProperty('--dy', dy)
}

function createView(list, element) {
  const view = {
    element: element,
    get width() {return window.getComputedStyle(this.element).width},
    get height() {return window.getComputedStyle(this.element).height}
  }
  list.push(view)
  return view
}

function init(root, selector, anchors, options) {
  const defaultOptions = {
    horizontal: false,
    timefunc: 'ease',
    duration: 300,
    delay: 0
  }

  const initialOptions = options? {
    horizontal: options.horizontal || defaultOptions.horizontal,
    timefunc: options.timefunc || defaultOptions.timefunc,
    duration: options.duration || defaultOptions.duration,
    delay: options.delay || defaultOptions.delay,
  } : defaultOptions

  // todo: make root subnode mandatory with checks
  const inner = root.children[0]

  const scrollpage = {
    root: root,
    inner: inner,
    selector: selector,
    anchors: anchors,
    views: [],
    currentViewIndex: 0,
    options: initialOptions,
    scrollForward: null,
    scrollBackward: null,
    scroll: (to) => {
      let dx = 0.0
      let dy = 0.0
      
      let index = 0
      let from = null
      let sign = 1

      if (typeof to == 'string') {
        index = anchors.indexOf(to)
        if (index === -1)
          throw new ScrollpageError(`No such view: ${to}!`)
      } else {
        index = to
        if (!(0 < to < scrollpage.views.length - 1))
          throw new ScrollpageError('Out of bounds!' + `No such view: ${to}!`)
      }

      sign = scrollpage.current.index - index > 0? sign : -1
      from = scrollpage.current.element
      to = scrollpage.views[to].element

      if (from === to) return

      if (scrollpage.options.horizontal) {
        dx = to.getClientRects()[0].x
      } else {
        dy = -to.getClientRects()[0].y
      }

      dx = dx.toFixed(1)
      dy = dy.toFixed(1)

      console.log(dx, dy)

      scrollpage.root.style.setProperty('--dx', `${dx}px`)
      scrollpage.root.style.setProperty('--dy', `${dy}px`)
      scrollpage.currentViewIndex = index
      
      console.log(to, scrollpage.currentViewIndex)
    },
    get current () {return this.views[this.currentViewIndex]},
  }

  const childrens = scrollpage.inner.children

  if (scrollpage.selector) {
    for (let i = 0; i < childrens.length; i++) {
      let child = childrens[i]
      if (child.classList.contains(scrollpage.selector)) {
        createView(scrollpage.views, child)
      }
      child.id = scrollpage.selector[i]
    }
  } else {
    for (let i = 0; i < childrens.length; i++) {
      let child = childrens[i]
      createView(scrollpage.views, child)
    }
  }
  
  // Check if anchors and views are valid

  if (!(scrollpage.anchors && scrollpage.anchors.length))
    throw new ScrollpageError("List of anchors (element's ids) might not be empty!")

  if (!(scrollpage.views.length === scrollpage.anchors.length))
    throw new ScrollpageError('Count of anchors might be equal to `fullpage-scrolling-layout` component childrens!')
  
  // Complating the formation of view objects

  scrollpage.views.forEach((view, i) => {
    view.anchor = scrollpage.anchors[i]
    view.index = i
    view.element.classList.add('view')
  })

  scrollpage.root.style.setProperty('--transition-duration', `${scrollpage.options.duration}ms`)

  return scrollpage
}

export default init