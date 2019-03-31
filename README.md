# cssTreeShaking
A project to statically analyse and prune redundant classname declarations and create a custom library of global styles


If you are using React 15 and using withStyles ( https://www.npmjs.com/package/withstyles ) and you have the following file structure:

   componentName
      -> index.js
      -> styles.css
      
      
      
And you importing styles.css object into index and returning a HOC from index.js:

  export default withStyles(s)(ComponentName);
  
  

Then you can have this problem that 

1. Every developer is creating their own styles in styles.css, since there is no global style availble. 
2. Stylessheets will keep on increasing in size - since no developer will ever delete any style rule. This can cause:

   a. Unused classes  - which are declared in css - but not used in index.js
   b. Classes defined in jsx but don't have definition in css
   c. Empty classes in styles.css (which have no body)
   
   
 
 To work out these problems - this nodejs script can traverse your filesystem from a starting point and find out all such dependent siblings of index.js and styles.css . Then, there is a pruning script which will tell you about problems occuring in [a, b, c]
 
 
 This is work in progress and I will keep updating.
   
   
  

