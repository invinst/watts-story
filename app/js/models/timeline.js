import ScrollMagic from 'scrollmagic/scrollmagic/uncompressed/ScrollMagic';
import 'scrollmagic/scrollmagic/uncompressed/plugins/animation.gsap';
import 'scrollmagic/scrollmagic/uncompressed/plugins/debug.addIndicators';
// import TweenMax from 'gsap/src/uncompressed/TweenMax';
// import TimelineMax from 'gsap/src/uncompressed/TimelineMax';


// init controller
const controller = new ScrollMagic.Controller();

// build scene
export const scene = new ScrollMagic.Scene({
  triggerElement: '#trigger-10', duration: 300, offset: -100
})
  // .setTween('#scene-10', 0.5, { scale: 2.5 }) // trigger a TweenMax.to tween
  .setClassToggle('scene-10', 'active')
  .addIndicators({ name: '2 (duration: 300)' }) // add indicators (requires plugin)
  .addTo(controller);
