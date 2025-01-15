import org.gradle.api.tasks.Exec
import java.io.ByteArrayOutputStream

// Helper function to run a Git command and capture output
fun runGitCommand(command: List<String>): String {
    val outputStream = ByteArrayOutputStream()
    exec {
        commandLine = command
        standardOutput = outputStream
        errorOutput = outputStream
        isIgnoreExitValue = true
    }
    return outputStream.toString().trim()
}

// Task to get the latest Git tag
val getLatestTag = tasks.register("getLatestTag") {
    doLast {
        val latestTag = runGitCommand(listOf("git", "describe", "--tags", "--abbrev=0"))
        project.extra["latestTag"] = latestTag
        println("Latest tag: $latestTag")
    }
}

// Task to find changed files since the last tag
val findChangedFiles = tasks.register("findChangedFiles") {
    dependsOn(getLatestTag)

    doLast {
        val latestTag = project.extra["latestTag"] as String
        val changedFiles = runGitCommand(listOf("git", "diff", "--name-only", "$latestTag..HEAD"))
            .lines()
        println("Changed files since $latestTag:\n${changedFiles.joinToString("\n")}")
        
        project.extra["changedFiles"] = changedFiles.joinToString("\n")
    }
}

// Task to detect changed modules
tasks.register("detectChangedModules") {
    dependsOn(findChangedFiles)

    doLast {
        val changedFiles = (project.extra["changedFiles"] as String)
            .lines()

        val modulePaths = subprojects.map { it.projectDir.relativeTo(rootDir).path }

        val affectedModules = modulePaths.filter { path ->
            changedFiles.any { it.startsWith(path) }
        }

        println("Affected modules: ${affectedModules.joinToString(", ")}")
    }
}