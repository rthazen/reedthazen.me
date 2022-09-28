---
title: 'Three ways to call a function on events'
date: '2022-09-27'
---

When using event handlers like `onClick` or `focus` you may see three different ways of calling the callback function in React:

**1.** Call the **function directly** in the event handler (ie: **setIsOpen(true)** or **handleClick()**).  These functions get called on the mount in React.  Now if the function updates the state like **setIsOpen(true)** seems to be doing this will cause an infinite loop of rerenders as the component updates with each state update and the state updates with every mount.  Round and round. For **handleClick()** I think since the **event** parameter is not passed specifically it will not trigger the function, but if you did something like **handleClick(event)** and then had:
``` javascript
const handleClick = event => {
    event.preventDefault()
    console.log('I was clicked')
  }
```
it would run, but again on the mounting of the component.

**2.** Use an **arrow function** (ie: **() => setIsOpen(true)** or **() => handleClick('I was clicked')**).  This will make sure the event handler needs to be triggered before the function will run.  So it will not be triggered automatically on the mount. This also lets you decide how to reference the function.  The **() => setIsOpen(true)** is defined inline and the **() => handleClick('I was clicked')** passes a parameter.

**3.** Pass a **reference to the function** (ie: just **handleClick**).  Like the arrow function this will not execute until the event in triggered.  This is also short syntax for an arrow function that passes the event parameter **event => clickHandler(event)**, so if you need it you have access to the **event** parameter in the **handleClick** function.  You cannot pass **false** to prevent default behavior. The **preventDefault** on the event needs to be called explicitly.

*I have a slight feeling I'm missing something, so I will update if I further my understanding



references: [1](https://blog.devgenius.io/why-it-is-necessary-to-use-arrow-functions-with-react-event-handler-e0b278710310), [2](https://teamtreehouse.com/community/why-do-we-call-the-functions-without-parentheses-ie), [3](https://laurieontech.com/posts/function-fun/), [4](https://reactjs.org/docs/handling-events.html)