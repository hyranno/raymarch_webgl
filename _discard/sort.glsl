void sort(in TYPE src[NUM], in float values[NUM], out TYPE dest[NUM]) {}

void mergeSort(inout float values[1024], out int indices[1024], int len) {
  for (int i=0; i < len; i++) {
    indices[i] = i;
  }
  for (int level=1; level < log2(len); level++) {
    int maxlen = 1 << level;
    for (int offset=0; offset < len; offset += maxlen) {
      int localLen = min(maxlen, len-offset);
      //
    }
  }
}
