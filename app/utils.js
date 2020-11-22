// downsample the buoy points to approximately the desired number of points
const downsample = (data, numPoints) => {
  const mod = Math.floor(data.length / numPoints);
  console.log(mod);
  return data.filter((val, idx) => idx % mod == 0);
};

module.exports = {
  downsample
};
