Selects everything
```
select ?s ?p ?o
where
{
  ?s ?p ?o
  }
```

Select everything in `http://library.temple.edu/system/tul` (which should be everything)
```
select ?s ?p ?o
where
{
  ?s ?p ?o .
  ?s tul:inEntity <http://library.temple.edu/system/tul>
  }
```

Select all statements associated with a staff member (Person)
```
select ?p ?o
where
{
  <http://library.temple.edu/person/katy-rawdon> ?p ?o
  }
```

Select the `tul:type`'s (Classes) associated with a staff member
```
select ?type ?o
where
{
  <http://library.temple.edu/person/katy-rawdon> ?p ?o .
  ?o tul:type ?type
  }
```

Select all statements associated with a given building
```
select ?p ?o
where
{
  <http://library.temple.edu/building/meded> ?p ?o

  }
```

Select the unique `tul:type`'s (Classes) associated with a given building
```
select DISTINCT ?type
where
{
  <http://library.temple.edu/building/meded> ?p ?o .
  ?s tul:hasEntity ?o .
  ?o tul:type ?type
  }
```