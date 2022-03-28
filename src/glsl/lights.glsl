
${lights.map((l)=>`
  ${l.getGlVars()}
  void light_getPhotonTo_${l.id} (vec3 point, out Photon photon) {${l.GlFunc_getPhotonTo()}}
  //void light_getPhoton_${l.id} (out Ray ray) {} //called by photon mapper, vary with thread_id
`).join("")}
