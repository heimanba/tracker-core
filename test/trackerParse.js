const attr = "createsaeconfirmbtnconfirm";
const attrList = attr.split("&");
const attrMap = {};
attrList.forEach((item) => {
  const list = item.split("=");
  console.log(list)
  if (list.length > 1) {
    attrMap[list[0]] = list[1];
  } else {
    attrMap["name"] = list[0];
  }
});
console.log(attrMap);
