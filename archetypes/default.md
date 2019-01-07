---
title: "{{ humanize .Name | title }}"
module: "{{ delimit (intersect (split .File.Dir "/") (slice "1" "2" "3" "4" "5" "6" "7" "8" "9")) "." }}."
menu:
  main:
    parent: ""
    weight: 
---

## Lesson Notes
...

# Specification

## {{ delimit (intersect (split .File.Dir "/") (slice "1" "2" "3" "4" "5" "6" "7" "8" "9")) "." }}. ...
...
