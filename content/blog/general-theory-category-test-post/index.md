---
layout: blog
title: LIVING WITHOUT THE GENERAL THEORY
category: General Theory
category_id: general-theory
excerpt: Quantifying complex human interactions, converting mechanisms of the
  society into equations, filling models with data, perhaps all disposable
  information, and ultimately deriving causalities, and of utmost importance -
  factual wisdom - it was all assumed to establish « The General Theory ».
date: 2021-11-22T16:32:55.598Z
cover_image: https://ucarecdn.com/7b779b2d-60e0-4d8a-9006-bba588787440/
---
<!--StartFragment-->

In [data mining](https://en.wikipedia.org/wiki/Data_mining "Data mining") and [statistics](https://en.wikipedia.org/wiki/Statistics "Statistics"), **hierarchical clustering** (also called **hierarchical cluster analysis** or **HCA**) is a method of [cluster analysis](https://en.wikipedia.org/wiki/Cluster_analysis "Cluster analysis") which seeks to build a [hierarchy](https://en.wikipedia.org/wiki/Hierarchy "Hierarchy") of clusters. Strategies for hierarchical clustering generally fall into two types:[\[1]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-clusteringMethods-1)

* **Agglomerative**: This is a "[bottom-up](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design "Top-down and bottom-up design")" approach: each observation starts in its own cluster, and pairs of clusters are merged as one moves up the hierarchy.
* **Divisive**: This is a "[top-down](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design "Top-down and bottom-up design")" approach: all observations start in one cluster, and splits are performed recursively as one moves down the hierarchy.

In general, the merges and splits are determined in a [greedy](https://en.wikipedia.org/wiki/Greedy_algorithm "Greedy algorithm") manner. The results of hierarchical clustering[\[2]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-2) are usually presented in a [dendrogram](https://en.wikipedia.org/wiki/Dendrogram "Dendrogram").

The standard algorithm for **hierarchical agglomerative clustering** (HAC) has a [time complexity](https://en.wikipedia.org/wiki/Time_complexity "Time complexity") of ![{\\mathcal {O}}(n^{3})](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff78e74de3bf7a5246829c66bc5acf0c2a94b67c) and requires ![\\Omega (n^{2})](https://wikimedia.org/api/rest_v1/media/math/render/svg/c14304cd1cb8bf603cb59037b666c5a85cd8e7ae) memory, which makes it too slow for even medium data sets. However, for some special cases, optimal efficient agglomerative methods (of complexity ![{\\mathcal {O}}(n^{2})](https://wikimedia.org/api/rest_v1/media/math/render/svg/4441d9689c0e6b2c47994e2f587ac5378faeefba)) are known: **SLINK**[\[3]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-SLINK-3) for [single-linkage](https://en.wikipedia.org/wiki/Single-linkage_clustering "Single-linkage clustering") and CLINK[\[4]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-CLINK-4) for [complete-linkage clustering](https://en.wikipedia.org/wiki/Complete-linkage_clustering "Complete-linkage clustering"). With a [heap](https://en.wikipedia.org/wiki/Heap_(data_structure) "Heap (data structure)"), the runtime of the general case can be reduced to ![{\\mathcal  {O}}(n^{2}\\log n)](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff9d8247a11fce04adfd903d817db246a6d3d44b), an improvement on the aforementioned bound of ![{\\mathcal {O}}(n^{3})](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff78e74de3bf7a5246829c66bc5acf0c2a94b67c), at the cost of further increasing the memory requirements. In many cases, the memory overheads of this approach are too large to make it practically usable.

Except for the special case of single-linkage, none of the algorithms (except exhaustive search in ![{\\displaystyle {\\mathcal {O}}(2^{n})}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9e36948445d0efd3f0b41d0bd7d281571e72492d)) can be guaranteed to find the optimum solution.

Divisive clustering with an exhaustive search is ![{\\displaystyle {\\mathcal {O}}(2^{n})}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9e36948445d0efd3f0b41d0bd7d281571e72492d), but it is common to use faster heuristics to choose splits, such as [*k*-means](https://en.wikipedia.org/wiki/K-means_clustering "K-means clustering").

<!--EndFragment--><!--StartFragment-->

In [data mining](https://en.wikipedia.org/wiki/Data_mining "Data mining") and [statistics](https://en.wikipedia.org/wiki/Statistics "Statistics"), **hierarchical clustering** (also called **hierarchical cluster analysis** or **HCA**) is a method of [cluster analysis](https://en.wikipedia.org/wiki/Cluster_analysis "Cluster analysis") which seeks to build a [hierarchy](https://en.wikipedia.org/wiki/Hierarchy "Hierarchy") of clusters. Strategies for hierarchical clustering generally fall into two types:[\[1]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-clusteringMethods-1)

* **Agglomerative**: This is a "[bottom-up](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design "Top-down and bottom-up design")" approach: each observation starts in its own cluster, and pairs of clusters are merged as one moves up the hierarchy.
* **Divisive**: This is a "[top-down](https://en.wikipedia.org/wiki/Top-down_and_bottom-up_design "Top-down and bottom-up design")" approach: all observations start in one cluster, and splits are performed recursively as one moves down the hierarchy.

In general, the merges and splits are determined in a [greedy](https://en.wikipedia.org/wiki/Greedy_algorithm "Greedy algorithm") manner. The results of hierarchical clustering[\[2]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-2) are usually presented in a [dendrogram](https://en.wikipedia.org/wiki/Dendrogram "Dendrogram").

The standard algorithm for **hierarchical agglomerative clustering** (HAC) has a [time complexity](https://en.wikipedia.org/wiki/Time_complexity "Time complexity") of ![{\\mathcal {O}}(n^{3})](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff78e74de3bf7a5246829c66bc5acf0c2a94b67c) and requires ![\\Omega (n^{2})](https://wikimedia.org/api/rest_v1/media/math/render/svg/c14304cd1cb8bf603cb59037b666c5a85cd8e7ae) memory, which makes it too slow for even medium data sets. However, for some special cases, optimal efficient agglomerative methods (of complexity ![{\\mathcal {O}}(n^{2})](https://wikimedia.org/api/rest_v1/media/math/render/svg/4441d9689c0e6b2c47994e2f587ac5378faeefba)) are known: **SLINK**[\[3]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-SLINK-3) for [single-linkage](https://en.wikipedia.org/wiki/Single-linkage_clustering "Single-linkage clustering") and CLINK[\[4]](https://en.wikipedia.org/wiki/Hierarchical_clustering#cite_note-CLINK-4) for [complete-linkage clustering](https://en.wikipedia.org/wiki/Complete-linkage_clustering "Complete-linkage clustering"). With a [heap](https://en.wikipedia.org/wiki/Heap_(data_structure) "Heap (data structure)"), the runtime of the general case can be reduced to ![{\\mathcal  {O}}(n^{2}\\log n)](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff9d8247a11fce04adfd903d817db246a6d3d44b), an improvement on the aforementioned bound of ![{\\mathcal {O}}(n^{3})](https://wikimedia.org/api/rest_v1/media/math/render/svg/ff78e74de3bf7a5246829c66bc5acf0c2a94b67c), at the cost of further increasing the memory requirements. In many cases, the memory overheads of this approach are too large to make it practically usable.

Except for the special case of single-linkage, none of the algorithms (except exhaustive search in ![{\\displaystyle {\\mathcal {O}}(2^{n})}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9e36948445d0efd3f0b41d0bd7d281571e72492d)) can be guaranteed to find the optimum solution.

Divisive clustering with an exhaustive search is ![{\\displaystyle {\\mathcal {O}}(2^{n})}](https://wikimedia.org/api/rest_v1/media/math/render/svg/9e36948445d0efd3f0b41d0bd7d281571e72492d), but it is common to use faster heuristics to choose splits, such as [*k*-means](https://en.wikipedia.org/wiki/K-means_clustering "K-means clustering").

<!--EndFragment-->