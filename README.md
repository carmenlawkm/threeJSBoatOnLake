# Project overview
This project is done with three.js and modification to the shader programs in glsl.

## Techniques and features
- Water ripples and reflection: to render a realistic scene with reflections and water rippling animation. This was the most time consuming part and is most relevant to lecture subjects (rendering the scene, turning it into a texture, and mapping it to the plane of water)
- UV mapped boat with subtle animation: the boat moves up and down with the water.
- Randomly generated lanterns, colour, and stars: to make the scene more unpredicatable in a good sense, I've decided to randomize most particles so you get a different view everytime. The lanterns are randomly chosen in a range of colours. However, in some rare cases, the boat might be overly exposed with lights if the lanterns are too close to the boat. The intensity and travel distance of the light has been experimented with, and this current parameter creates the most consistent effect with the random generation.
- Point light inside the lantern: to reflect lights to the surrounding objects.
- Bloom: to make the scene more dreamy, I've applied a post processing effect/ glowing filter to the scene to make it more harmonized and make the paper laterns look more glowy. This is to also make the scene more hazey without looking foggy. I also had some trouble with this.

## Control
- Scroll wheel to zoom
- Left click and drag to rotate the view
- Right click and drag to pan

## Comment
My GPU is limited and I'm not able to attach a high quality rendering. It is suppose to be less pixelated! I tried to use a sprite sheet for the mountains, but it did not turn out as nice and also looked a bit buggy with the reflection, so I ended up using a low poly mountain for performance and aethetic reason.

The paper lanterns actually have paper texture mapped to it but it might not be very obvious due to the glow.

# Resources used
These are the links and resources I used to create my scene.

## Code template/ references used
- Threejs template: https://github.com/Robpayot/vite-threejs-template
- Water reflection demo from three.js: https://github.com/mrdoob/three.js/blob/master/examples/webgl_mirror.html
- Bloom/ post-processing from three.js: https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing_unreal_bloom.html
- General documentation: https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene

## Tutorials used
- Water reflection: https://www.youtube.com/watch?v=PAy5aQK2pSg

## Assets used
- Boat: https://www.cgtrader.com/items/3846167/download-page
- Tree: https://www.cgtrader.com/items/3461467/download-page
- Paper lantern texture: https://t3.ftcdn.net/jpg/00/66/88/14/360_F_66881413_ZDhq7wpjxKlynSYqVlZbs7cVwqzec8G1.jpg
- Mountain: https://www.cgtrader.com/items/3043963/download-page
= Lantern/ box: https://www.cgtrader.com/items/3043963/download-page
