/*
Original Papers:
  NAKAZAWA Takahisa, TAURA Kenjiro
  The University of Tokyo
*/

void saw_sort(int start, int length) {
  if (length > 1) {
    int m = length/2;
    saw_sort(start, m);
    saw_sort(start+m, m);
    saw_merge(start, length);
  }
}

//when (flag > m)
void saw_merge(int start, int length, int flag) {
  int m = length/2;
  int num_swap = 0;
  for (int i=0; i < length-flag; i++) { //swap([m-num_swap, m], [flag, flag+num_swap])
    int i0 = (start+m-1)-i; //back from center
    int i1 = (start+flag)+i; //forward from flag
    if (items[i0] > items[i1]) {
      swap(items[i0], items[i1]);
      num_swap++;
    }
  }
  for (int i=0; i<(flag-m)/2; i++) { //[m, flag).rev
    swap(items[start+m+i], items[start+flag-1-i]);
  }
  for (int i=0; i < num_swap/2; i++) { //[m-num_swap, m).rev
    swap(items[start+m-num_swap +i], items[start+m-1 -i]);
  }
  for (int i=0; i < (flag-m+num_swap)/2; i++) { //[m, flag+num_swap).rev
    swap(items[start+m+i], items[start+flag+num_swap-1 -i]);
  }
  int left = m-num_swap;
  int right = flag+num_swap-m;
  saw_merge(start, m, left);
  saw_merge(m, m, right);
}


/*
rewrite 1
*/

void swap(inout float v0, inout float v1) {
  float t = v0;
  v0 = v1;
  v1 = t;
}
void conditional_swap(inout float v0, inout float v1, bool cond) {
  float t0 = v0;
  float t1 = v1;
  v0 = mix(t0, t1, cond);
  v1 = mix(t1, t0, cond);
}

void saw_sort (int start, int depth) {
  int len = 1 << depth;
  if (depth > 0) {
    saw_sort(start, depth-1);
    saw_sort(start+len/2, depth-1);
    saw_merge(start, depth, len/2);
  }
}
void saw_merge(int start, int depth, int partition) {
  int len = 1 << depth;
  int m = len/2;
  int num_swap = 0;
  if (partition == m) {
    return;
  }
  if (partition > m) {
    for (int i=0; i < len-partition; i++) {
      int i0 = start+m-1 -i;
      int i1 = start+partition +i;
      float cond = coef_isGreater(items[i0], items[i1]);
      conditional_swap(items[i0], items[i1], cond);
      num_swap += int(cond);
    }
    for (int i=0; i<(partition-m)/2; i++) { //[m, partition).rev
      swap(items[start+m+i], items[start+partition-1-i]);
    }
    for (int i=0; i < num_swap/2; i++) { //[m-num_swap, m).rev
      swap(items[start+m-num_swap +i], items[start+m-1 -i]);
    }
    for (int i=0; i < (partition-m+num_swap)/2; i++) { //[m, partition+num_swap).rev
      swap(items[start+m+i], items[start+partition+num_swap-1 -i]);
    }
    int left = m - num_swap;
    int right = partition-m + num_swap;
    saw_merge(start, m, left);
    saw_merge(m, m, right);
  }
  if (partition < m) {
    for (int i=0; i < len-partition; i++) {
      int i0 = start+partition -i;
      int i1 = start+m-1 +i;
      float cond = coef_isGreater(items[i0], items[i1]);
      conditional_swap(items[i0], items[i1], cond);
      num_swap += int(cond);
    }
    for (int i=0; i<(partition-m)/2; i++) { //[partition, m).rev
      swap(items[start+m-1-i], items[start+partition+i]);
    }
    for (int i=0; i < num_swap/2; i++) { //[m, m+num_swap).rev
      swap(items[start+m+num_swap-1 -i], items[start+m +i]);
    }
    for (int i=0; i < -(partition+num_swap-m)/2; i++) { //[partition-num_swap, m).rev
      swap(items[start+m-1-i], items[start+partition-num_swap +i]);
    }
    int left = partition - num_swap;
    int right = m + num_swap;
    saw_merge(start, m, left);
    saw_merge(m, m, right);
  }
}


/*
rewrite2
*/
int mix(int x, int y, bool a) {
  return int(mix(float(x), float(y), a));
}

void saw_merge(int start, int depth, int partition) {
  int len = 1 << depth;
  int m = len/2;
  int num_swap = 0;
  bool is_partition_right = partition > m;
  for (int i=0; i < len-partition; i++) {
    int i0 = start + mix(partition, m-1, is_partition_right) -i;
    int i1 = start + mix(m-1, partition, is_partition_right) +i;
    float cond = coef_isGreater(items[i0], items[i1]);
    conditional_swap(items[i0], items[i1], cond);
    num_swap += int(cond);
  }
  for (int i=0; i < abs(partition-m)/2; i++) { //[partition, m).rev
    swap(items[start + mix(partition, m, is_partition_right) + i], items[start + mix(m, partition, is_partition_right) -1 -i]);
  }
  for (int i=0; i < num_swap/2; i++) { //[m-num_swap, m).rev
    swap(items[start+m -mix(0, num_swap, is_partition_right) +i], items[start+m +mix(num_swap, 0, is_partition_right) -1 -i]);
  }
  for (int i=0; i < abs(partition+num_swap-m)/2; i++) { //[partition-num_swap, m).rev
    swap(items[start +mix(partition-num_swap, m, is_partition_right) +i], items[start +mix(m, partition+num_swap, is_partition_right) -1-i]);
  }
  int left = mix(partition, m, is_partition_right) - num_swap;
  int right = mix(m, partition-m, is_partition_right) + num_swap;
  saw_merge(start, m, left);
  saw_merge(m, m, right);
}

/*
rewrite3
*/
void saw_merge(int start, int depth, int partition) {
  int thread_id = ;
  int i = thread_id;
  int len = 1 << depth;
  int m = start + len/2;
  //if (partition == start || partition == start+len) { return; }
  bool is_partition_right = partition > m;
  shared int num_swap;
  int i0 = start + mix(partition, m-1, is_partition_right) -i;
  int i1 = start + mix(m-1, partition, is_partition_right) +i;
  conditional_swap(items[i0], items[i1], (items[i0] > items[i1]) && (i < len-partition));
  if (i == start) {
    num_swap = 0;
  }
  memoryBarrierShared();
  if ((items[i0]>items[i1]) && !(items[i0-1]>items[i1+1])) {
    num_swap = i+1;
  }
  memoryBarrierShared();
  conditional_swap( //[partition, m).rev
    items[start + mix(partition, m, is_partition_right) + i],
    items[start + mix(m, partition, is_partition_right) -1 -i],
    i < abs(partition-m)/2
  );
  conditional_swap( //[m-num_swap, m).rev
    items[start+m -mix(0, num_swap, is_partition_right) +i],
    items[start+m +mix(num_swap, 0, is_partition_right) -1 -i],
    i < num_swap/2
  );
  conditional_swap( //[partition-num_swap, m).rev
    items[start +mix(partition-num_swap, m, is_partition_right) +i],
    items[start +mix(m, partition+num_swap, is_partition_right) -1-i],
    i < abs(partition+num_swap-m)/2
  );
  int left = mix(partition, m, is_partition_right) - num_swap;
  int right = mix(m, partition-m, is_partition_right) + num_swap;
  saw_merge(start, m, left);
  saw_merge(m, m, right);
}


/*
rewrite4
*/
void saw_merge(inout items[], int start, int len) {
  int thread_id;
  shared int partition[len];
  shared int num_swap[len];
  if (thread_id == 0) {
    partition[0] = len/2;
    num_swap[0] = 0;
  }
  for (int local_len = len; local_len > 1; local_len/=2) {
    int block_id = thread_id / local_len;
    int local_start = start + block_id * local_len;
    int i = thread_id % local_len;
    bool is_partition_right = partition[block_id];
    int i0 = local_start + mix(partition, local_len/2-1, is_partition_right) -i;
    int i1 = local_start + mix(local_len/2-1, partition, is_partition_right) +i;
    conditional_swap(
      items[i0],
      items[i1],
      (items[i0] > items[i1]) && (i < local_len-partition[block_id])
    );
    memoryBarrierShared();
    if ((items[i0]>items[i1]) && !(items[i0-1]>items[i1+1])) {
      num_swap[block_id] = i+1;
    }
    memoryBarrierShared();
    conditional_swap( //[partition, m).rev
      items[local_start + mix(partition[block_id], local_len/2, is_partition_right) + i],
      items[local_start + mix(local_len/2, partition[block_id], is_partition_right) -1 -i],
      i < abs(partition[block_id]-local_len/2)/2
    );
    conditional_swap( //[m-num_swap, m).rev
      items[local_start +local_len/2 -mix(0, num_swap[block_id], is_partition_right) +i],
      items[local_start +local_len/2 +mix(num_swap[block_id], 0, is_partition_right) -1 -i],
      i < num_swap[block_id]/2
    );
    conditional_swap( //[partition-num_swap, m).rev
      items[local_start +mix(partition[block_id]-num_swap[block_id], local_len/2, is_partition_right) +i],
      items[local_start +mix(local_len/2, partition[block_id]+num_swap[block_id], is_partition_right) -1-i],
      i < abs(partition[block_id]+num_swap[block_id]-local_len/2)/2
    );
    int left = mix(partition[block_id], local_len/2, is_partition_right) - num_swap[block_id];
    int right = mix(local_len/2, partition[block_id]-local_len/2, is_partition_right) + num_swap[block_id];
    memoryBarrierShared();
    if (i == 0) {
      num_swap[2*block_id] = 0;
      num_swap[2*block_id+1] = 0;
      partition[2*block_id] = left;
      partition[2*block_id+1] = right;
    }
  }
}


/*
rewrite5
*/
void saw_sort (inout items[], int len) {
  for (int local_len = 1; local_len<len; local_len*=2) {
    saw_merge(items, len, local_len);
  }
}
void saw_merge(inout items[], int len, int merge_len) {
  int thread_id;
  shared int partition[len];
  shared int num_swap[len];
  { //init partition, num_swap
    int block_id = thread_id / merge_len;
    int i = thread_id % merge_len;
    if (i == 0) {
      partition[block_id] = merge_len/2;
      num_swap[block_id] = 0;
    }
  }
  for (int local_len = merge_len; local_len > 1; local_len/=2) {
    int block_id = thread_id / local_len;
    int local_start = start + block_id * local_len;
    int i = thread_id % local_len;
    bool is_partition_right = partition[block_id];
    int i0 = local_start + mix(partition, local_len/2-1, is_partition_right) -i;
    int i1 = local_start + mix(local_len/2-1, partition, is_partition_right) +i;
    if ((items[i0]>items[i1]) && !(items[i0-1]>items[i1+1])) {
      num_swap[block_id] = i+1;
    }
    memoryBarrierShared();
    conditional_swap(
      items[i0],
      items[i1],
      (items[i0] > items[i1]) && (i < local_len-partition[block_id])
    );
    conditional_swap( //[partition, m).rev
      items[local_start + mix(partition[block_id], local_len/2, is_partition_right) + i],
      items[local_start + mix(local_len/2, partition[block_id], is_partition_right) -1 -i],
      i < abs(partition[block_id]-local_len/2)/2
    );
    conditional_swap( //[m-num_swap, m).rev
      items[local_start +local_len/2 -mix(0, num_swap[block_id], is_partition_right) +i],
      items[local_start +local_len/2 +mix(num_swap[block_id], 0, is_partition_right) -1 -i],
      i < num_swap[block_id]/2
    );
    conditional_swap( //[partition-num_swap, m).rev
      items[local_start +mix(partition[block_id]-num_swap[block_id], local_len/2, is_partition_right) +i],
      items[local_start +mix(local_len/2, partition[block_id]+num_swap[block_id], is_partition_right) -1-i],
      i < abs(partition[block_id]+num_swap[block_id]-local_len/2)/2
    );
    int left = mix(partition[block_id], local_len/2, is_partition_right) - num_swap[block_id];
    int right = mix(local_len/2, partition[block_id]-local_len/2, is_partition_right) + num_swap[block_id];
    memoryBarrierShared();
    if (i == 0) {
      num_swap[2*block_id] = 0;
      num_swap[2*block_id+1] = 0;
      partition[2*block_id] = left;
      partition[2*block_id+1] = right;
    }
    memoryBarrierShared();
  }
}
