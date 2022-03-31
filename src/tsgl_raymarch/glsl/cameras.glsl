
${cameras.map((c)=>c.getGlImplements()).join("")}

void getRay(uint id, out Ray ray) {
  ${cameras.map((c)=>`
    if (id == uint(${c.id})) { getRay_${c.id}(ray); }
  `).join("")}
}
