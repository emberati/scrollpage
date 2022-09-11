class ScrollViewError extends Error {
  constructor(message) {
    super(message)
    this.name ='ScrollViewError'
  }
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

function init(root, selector, anchors) {
  const scrollpage = {
    root: root,
    selector: selector,
    anchors: anchors,
    views: [],
    currentViewIndex: 0,
    get current () {return this.views[this.currentViewIndex]}
  }

  const childrens = scrollpage.root.children
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
  
  if (!(scrollpage.anchors && scrollpage.anchors.length))
    throw new ScrollViewError("List of anchors (element's ids) might not be empty!")

  if (!(scrollpage.views.length === scrollpage.anchors.length))
    throw new ScrollViewError('Count of anchors might be equal to `fullpage-scrolling-layout` component childrens!')
  
  scrollpage.views.forEach((view, i) => {
    view.anchor = scrollpage.anchors[i]
    view.element.classList.add('view')
  })

  return scrollpage
}

export default init