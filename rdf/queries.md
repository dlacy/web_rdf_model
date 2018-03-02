```
select ?s ?p ?o
where
{
  ?s ?p ?o
  }
```

```
select ?s ?p ?o
where
{
  ?s ?p ?o .
  ?s tul:inEntity <http://library.temple.edu/system/tul>
  }
```

```
select ?p ?o
where
{
  <http://library.temple.edu/person/katy-rawdon> ?p ?o
  }
```

```
select ?type ?o
where
{
  <http://library.temple.edu/person/katy-rawdon> ?p ?o .
  ?o tul:type ?type
  }
```

```
select ?p ?o
where
{
  <http://library.temple.edu/building/meded> ?p ?o

  }
```

```
select DISTINCT ?type
where
{
  <http://library.temple.edu/building/meded> ?p ?o .
  ?s tul:hasEntity ?o .
  ?o tul:type ?type
  }
```