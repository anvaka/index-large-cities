# City data

This repository contains script to download graphs of major cities, stored in the `cities.txt`
and save them into protocol buffers forma inside `data` folder.

The actual `.pbf` file can then be rendered by https://github.com/anvaka/city-roads


Note: Previously the `.pbf` file were stored inside this repository, but github removed them.
I assume they were too large.


## How to use it

One time setup:

```
git clone https://github.com/anvaka/index-large-cities
cd index-large-cities
npm install
```

Then you should be able to download all cities from `cities.txt` file by running

```
node index.js
```